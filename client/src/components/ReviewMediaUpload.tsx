import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Play,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
}

interface ReviewMediaUploadProps {
  onMediaChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

/**
 * Review Media Upload Component
 * Upload photos and videos for product reviews
 * Supports drag-and-drop, preview, and progress tracking
 */
export default function ReviewMediaUpload({
  onMediaChange,
  maxFiles = 5,
  maxSizeMB = 50,
}: ReviewMediaUploadProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: MediaFile[] = [];

    for (const file of fileArray) {
      // Check file count limit
      if (mediaFiles.length + validFiles.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        break;
      }

      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        toast.error(`${file.name} exceeds ${maxSizeMB}MB limit`);
        continue;
      }

      // Check file type
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : null;

      if (!fileType) {
        toast.error(`${file.name} is not a valid image or video`);
        continue;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);

      validFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview,
        type: fileType,
        status: "pending",
        progress: 0,
      });
    }

    if (validFiles.length > 0) {
      const newMediaFiles = [...mediaFiles, ...validFiles];
      setMediaFiles(newMediaFiles);
      onMediaChange(newMediaFiles.map((m) => m.file));
      toast.success(`${validFiles.length} file(s) added`);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const newMediaFiles = mediaFiles.filter((m) => m.id !== fileId);
    setMediaFiles(newMediaFiles);
    onMediaChange(newMediaFiles.map((m) => m.file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickUpload}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${
            isDragging
              ? "border-purple-500 bg-purple-500/10"
              : "border-border hover:border-purple-500/50 bg-white/5"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-purple-500/20 rounded-full">
            <Upload className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <p className="text-foreground font-semibold mb-1">
              Click or drag files to upload
            </p>
            <p className="text-sm text-gray-400">
              Images and videos up to {maxSizeMB}MB • Max {maxFiles} files
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-purple-500/30 text-purple-400"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
        </div>
      </div>

      {/* File List */}
      {mediaFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {mediaFiles.length} / {maxFiles} files
            </p>
            {mediaFiles.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMediaFiles([]);
                  onMediaChange([]);
                }}
                className="text-red-400 hover:text-red-300"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mediaFiles.map((media) => (
              <Card
                key={media.id}
                className="relative p-2 bg-white/5 border-white/10 overflow-hidden"
              >
                {/* Preview */}
                <div className="relative aspect-square rounded-lg overflow-hidden bg-background/50 text-foreground">
                  {media.type === "image" ? (
                    <img
                      src={media.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={media.preview}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-background/30 text-foreground">
                        <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                          <Play className="w-6 h-6 text-foreground" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Type Badge */}
                  <Badge
                    className={`absolute top-2 left-2 ${
                      media.type === "image"
                        ? "bg-blue-500/80"
                        : "bg-purple-500/80"
                    }`}
                  >
                    {media.type === "image" ? (
                      <ImageIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <Video className="w-3 h-3 mr-1" />
                    )}
                    {media.type}
                  </Badge>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFile(media.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-foreground" />
                  </button>

                  {/* Status Indicator */}
                  {media.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-foreground">
                      <Loader2 className="w-8 h-8 text-foreground animate-spin" />
                    </div>
                  )}
                  {media.status === "success" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-600/60">
                      <CheckCircle className="w-8 h-8 text-foreground" />
                    </div>
                  )}
                  {media.status === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-600/60">
                      <AlertCircle className="w-8 h-8 text-foreground" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="mt-2">
                  <p className="text-xs text-gray-400 truncate">
                    {media.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(media.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                {/* Progress Bar */}
                {media.status === "uploading" && (
                  <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${media.progress}%` }}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/30">
        <h4 className="text-sm font-semibold text-blue-400 mb-2">
          Photo & Video Guidelines
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Show the product clearly in good lighting</li>
          <li>• Include multiple angles and details</li>
          <li>• Videos should be under 60 seconds</li>
          <li>• Avoid blurry or low-quality images</li>
          <li>• Keep content appropriate and relevant</li>
        </ul>
      </Card>
    </div>
  );
}

/**
 * Customer Photo Gallery
 * Display customer-uploaded photos for products
 */
interface CustomerPhotoGalleryProps {
  photos: Array<{
    id: string;
    url: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    createdAt: string;
  }>;
}

export function CustomerPhotoGallery({ photos }: CustomerPhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (photos.length === 0) {
    return (
      <Card className="p-8 bg-white/5 border-white/10 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-card rounded-full text-card-foreground">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400">No customer photos yet</p>
          <p className="text-sm text-gray-500">
            Be the first to share your photos!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo.url)}
            className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
          >
            <img
              src={photo.url}
              alt={`Photo by ${photo.userName}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center text-foreground">
              <ImageIcon className="w-6 h-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-background/90 flex items-center justify-center p-4 text-foreground"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
