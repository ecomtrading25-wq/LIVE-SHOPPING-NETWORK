/**
 * RTMP Ingestion Service
 * Handles RTMP stream ingestion, transcoding, and HLS/DASH delivery
 */

import { spawn, ChildProcess } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

interface StreamConfig {
  showId: string;
  streamKey: string;
  inputUrl: string;
  outputDir: string;
  qualities: StreamQuality[];
  recordingEnabled: boolean;
}

interface StreamQuality {
  name: string;
  width: number;
  height: number;
  bitrate: string;
  fps: number;
}

interface ActiveStream {
  showId: string;
  streamKey: string;
  process: ChildProcess;
  startedAt: Date;
  config: StreamConfig;
  stats: StreamStats;
}

interface StreamStats {
  duration: number;
  bitrate: number;
  fps: number;
  droppedFrames: number;
  viewers: number;
}

class RTMPIngestionService {
  private activeStreams: Map<string, ActiveStream> = new Map();
  private baseOutputDir: string;
  private rtmpPort: number;

  constructor(baseOutputDir: string = '/tmp/streams', rtmpPort: number = 1935) {
    this.baseOutputDir = baseOutputDir;
    this.rtmpPort = rtmpPort;
    
    // Ensure output directory exists
    if (!existsSync(baseOutputDir)) {
      mkdirSync(baseOutputDir, { recursive: true });
    }

    console.log(`[RTMP Ingestion] Service initialized (output: ${baseOutputDir}, port: ${rtmpPort})`);
  }

  /**
   * Start ingesting an RTMP stream
   */
  public async startStream(config: StreamConfig): Promise<boolean> {
    if (this.activeStreams.has(config.showId)) {
      console.error(`[RTMP Ingestion] Stream already active: ${config.showId}`);
      return false;
    }

    const outputDir = join(this.baseOutputDir, config.showId);
    
    // Create output directory
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Build FFmpeg command for adaptive bitrate streaming
    const ffmpegArgs = this.buildFFmpegArgs(config, outputDir);

    console.log(`[RTMP Ingestion] Starting stream ${config.showId}`);
    console.log(`[RTMP Ingestion] Input: ${config.inputUrl}`);
    console.log(`[RTMP Ingestion] Output: ${outputDir}`);

    const process = spawn('ffmpeg', ffmpegArgs);

    // Handle process output
    process.stdout.on('data', (data) => {
      // Parse FFmpeg output for stats
      this.parseFFmpegOutput(config.showId, data.toString());
    });

    process.stderr.on('data', (data) => {
      const output = data.toString();
      // FFmpeg writes progress to stderr
      this.parseFFmpegOutput(config.showId, output);
    });

    process.on('error', (error) => {
      console.error(`[RTMP Ingestion] Process error for ${config.showId}:`, error);
      this.stopStream(config.showId);
    });

    process.on('exit', (code) => {
      console.log(`[RTMP Ingestion] Process exited for ${config.showId} with code ${code}`);
      this.activeStreams.delete(config.showId);
    });

    // Store active stream
    this.activeStreams.set(config.showId, {
      showId: config.showId,
      streamKey: config.streamKey,
      process,
      startedAt: new Date(),
      config,
      stats: {
        duration: 0,
        bitrate: 0,
        fps: 0,
        droppedFrames: 0,
        viewers: 0,
      },
    });

    return true;
  }

  /**
   * Stop an active stream
   */
  public stopStream(showId: string): boolean {
    const stream = this.activeStreams.get(showId);
    if (!stream) {
      console.error(`[RTMP Ingestion] Stream not found: ${showId}`);
      return false;
    }

    console.log(`[RTMP Ingestion] Stopping stream ${showId}`);
    
    // Kill FFmpeg process
    stream.process.kill('SIGTERM');
    
    // Wait for graceful shutdown, then force kill if needed
    setTimeout(() => {
      if (stream.process.killed === false) {
        stream.process.kill('SIGKILL');
      }
    }, 5000);

    this.activeStreams.delete(showId);
    return true;
  }

  /**
   * Get stream statistics
   */
  public getStreamStats(showId: string): StreamStats | null {
    const stream = this.activeStreams.get(showId);
    return stream ? stream.stats : null;
  }

  /**
   * Get all active streams
   */
  public getActiveStreams(): string[] {
    return Array.from(this.activeStreams.keys());
  }

  /**
   * Check if stream is active
   */
  public isStreamActive(showId: string): boolean {
    return this.activeStreams.has(showId);
  }

  /**
   * Build FFmpeg arguments for adaptive bitrate streaming
   */
  private buildFFmpegArgs(config: StreamConfig, outputDir: string): string[] {
    const args: string[] = [
      '-i', config.inputUrl,
      '-c:a', 'aac',
      '-ar', '48000',
      '-b:a', '128k',
    ];

    // Add video encoding settings for each quality
    config.qualities.forEach((quality, index) => {
      args.push(
        '-map', '0:v',
        '-map', '0:a',
        `-c:v:${index}`, 'libx264',
        `-b:v:${index}`, quality.bitrate,
        `-s:v:${index}`, `${quality.width}x${quality.height}`,
        `-r:v:${index}`, quality.fps.toString(),
        `-maxrate:${index}`, quality.bitrate,
        `-bufsize:${index}`, `${parseInt(quality.bitrate) * 2}k`,
        `-preset`, 'veryfast',
        `-g`, '48',
        `-keyint_min`, '48',
        `-sc_threshold`, '0'
      );
    });

    // HLS output settings
    args.push(
      '-f', 'hls',
      '-hls_time', '4',
      '-hls_playlist_type', 'event',
      '-hls_segment_filename', join(outputDir, 'segment_%v_%03d.ts'),
      '-master_pl_name', 'master.m3u8',
      '-var_stream_map', this.buildStreamMap(config.qualities),
      join(outputDir, 'stream_%v.m3u8')
    );

    // Recording settings
    if (config.recordingEnabled) {
      args.push(
        '-c', 'copy',
        '-f', 'mp4',
        join(outputDir, 'recording.mp4')
      );
    }

    return args;
  }

  /**
   * Build stream map for FFmpeg
   */
  private buildStreamMap(qualities: StreamQuality[]): string {
    return qualities.map((_, index) => `v:${index},a:${index}`).join(' ');
  }

  /**
   * Parse FFmpeg output for statistics
   */
  private parseFFmpegOutput(showId: string, output: string) {
    const stream = this.activeStreams.get(showId);
    if (!stream) return;

    // Parse duration
    const durationMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1]);
      const minutes = parseInt(durationMatch[2]);
      const seconds = parseInt(durationMatch[3]);
      stream.stats.duration = hours * 3600 + minutes * 60 + seconds;
    }

    // Parse bitrate
    const bitrateMatch = output.match(/bitrate=\s*(\d+\.?\d*)\s*kbits\/s/);
    if (bitrateMatch) {
      stream.stats.bitrate = parseFloat(bitrateMatch[1]);
    }

    // Parse FPS
    const fpsMatch = output.match(/fps=\s*(\d+\.?\d*)/);
    if (fpsMatch) {
      stream.stats.fps = parseFloat(fpsMatch[1]);
    }

    // Parse dropped frames
    const droppedMatch = output.match(/drop=\s*(\d+)/);
    if (droppedMatch) {
      stream.stats.droppedFrames = parseInt(droppedMatch[1]);
    }
  }

  /**
   * Get HLS playlist URL for a stream
   */
  public getPlaylistUrl(showId: string): string | null {
    if (!this.isStreamActive(showId)) {
      return null;
    }
    return `/streams/${showId}/master.m3u8`;
  }

  /**
   * Clean up stream files
   */
  public cleanupStream(showId: string) {
    const outputDir = join(this.baseOutputDir, showId);
    if (existsSync(outputDir)) {
      try {
        rmSync(outputDir, { recursive: true, force: true });
        console.log(`[RTMP Ingestion] Cleaned up stream files for ${showId}`);
      } catch (error) {
        console.error(`[RTMP Ingestion] Failed to cleanup ${showId}:`, error);
      }
    }
  }

  /**
   * Generate stream key for a show
   */
  public static generateStreamKey(showId: string): string {
    const random = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    return `${showId}_${timestamp}_${random}`;
  }

  /**
   * Validate stream key
   */
  public static validateStreamKey(streamKey: string, showId: string): boolean {
    return streamKey.startsWith(`${showId}_`);
  }
}

// Default quality presets
export const DEFAULT_QUALITIES: StreamQuality[] = [
  {
    name: '1080p',
    width: 1920,
    height: 1080,
    bitrate: '5000k',
    fps: 30,
  },
  {
    name: '720p',
    width: 1280,
    height: 720,
    bitrate: '2500k',
    fps: 30,
  },
  {
    name: '480p',
    width: 854,
    height: 480,
    bitrate: '1000k',
    fps: 30,
  },
  {
    name: '360p',
    width: 640,
    height: 360,
    bitrate: '600k',
    fps: 30,
  },
];

// Singleton instance
let ingestionService: RTMPIngestionService | null = null;

export function initializeRTMPService(baseOutputDir?: string, rtmpPort?: number) {
  if (!ingestionService) {
    ingestionService = new RTMPIngestionService(baseOutputDir, rtmpPort);
  }
  return ingestionService;
}

export function getRTMPService() {
  if (!ingestionService) {
    throw new Error('RTMP service not initialized. Call initializeRTMPService() first.');
  }
  return ingestionService;
}

export { RTMPIngestionService, StreamConfig, StreamQuality, ActiveStream, StreamStats };
