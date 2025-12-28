/**
 * Seed Live Streaming Demo Data
 * Creates 50+ live shows, virtual gifts, host profiles, chat messages
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { nanoid } from 'nanoid';
import {
  liveShows,
  liveShowProducts,
  liveViewers,
  liveChatMessages,
  virtualGifts,
  liveGiftTransactions,
  hostProfiles,
  hostFollowers,
  users,
} from '../drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

console.log('🌱 Seeding live streaming demo data...');

// ============================================================================
// STEP 1: Create Demo Users (Hosts & Viewers)
// ============================================================================

console.log('Creating demo users...');

const demoUsers = [];
const hostUsers = [];

// Create 10 hosts
for (let i = 1; i <= 10; i++) {
  const hostUser = {
    id: 1000 + i,
    openId: `demo-host-${i}`,
    name: [
      'Sarah Johnson',
      'Mike Chen',
      'Emily Rodriguez',
      'David Kim',
      'Jessica Williams',
      'Alex Thompson',
      'Maria Garcia',
      'James Lee',
      'Lisa Anderson',
      'Ryan Martinez'
    ][i - 1],
    email: `host${i}@demo.com`,
    role: 'user',
  };
  hostUsers.push(hostUser);
  demoUsers.push(hostUser);
}

// Create 100 viewers
for (let i = 1; i <= 100; i++) {
  demoUsers.push({
    id: 2000 + i,
    openId: `demo-viewer-${i}`,
    name: `Viewer ${i}`,
    email: `viewer${i}@demo.com`,
    role: 'user',
  });
}

// Insert users (skip if they exist)
try {
  for (const user of demoUsers) {
    await db.insert(users).values(user).onDuplicateKeyUpdate({ set: { name: user.name } });
  }
  console.log(`✅ Created ${demoUsers.length} demo users`);
} catch (error) {
  console.log('⚠️  Users may already exist, continuing...');
}

// ============================================================================
// STEP 2: Create Host Profiles
// ============================================================================

console.log('Creating host profiles...');

const hostProfilesToCreate = hostUsers.map((host, i) => ({
  id: nanoid(),
  userId: host.id,
  displayName: host.name,
  bio: [
    'Fashion enthusiast sharing the latest trends and exclusive deals! 👗✨',
    'Tech reviewer bringing you the best gadgets and electronics 📱💻',
    'Beauty expert with tips, tutorials, and amazing product finds 💄💅',
    'Home decor specialist helping you create your dream space 🏡🎨',
    'Fitness coach sharing workout gear and wellness products 💪🏃',
    'Food lover showcasing kitchen essentials and cooking tools 🍳👨‍🍳',
    'Pet supplies expert helping you care for your furry friends 🐶🐱',
    'Gaming enthusiast with the latest games and accessories 🎮🕹️',
    'Book lover sharing literary treasures and reading essentials 📚📖',
    'Travel expert featuring luggage, gear, and adventure essentials ✈️🌍'
  ][i],
  isVerified: i < 5, // First 5 hosts are verified
  totalShows: Math.floor(Math.random() * 50) + 10,
  totalFollowers: Math.floor(Math.random() * 5000) + 500,
  totalRevenue: (Math.random() * 50000 + 10000).toFixed(2),
  rating: (Math.random() * 1 + 4).toFixed(2), // 4.0-5.0
  status: 'active',
}));

await db.insert(hostProfiles).values(hostProfilesToCreate);
console.log(`✅ Created ${hostProfilesToCreate.length} host profiles`);

// ============================================================================
// STEP 3: Create Virtual Gifts
// ============================================================================

console.log('Creating virtual gifts...');

const giftsToCreate = [
  {
    id: nanoid(),
    name: '❤️ Heart',
    description: 'Show some love!',
    price: '0.99',
    category: 'basic',
    displayOrder: 1,
  },
  {
    id: nanoid(),
    name: '🌹 Rose',
    description: 'A beautiful rose for your favorite host',
    price: '2.99',
    category: 'romantic',
    displayOrder: 2,
  },
  {
    id: nanoid(),
    name: '🎁 Gift Box',
    description: 'A special surprise!',
    price: '4.99',
    category: 'celebration',
    displayOrder: 3,
  },
  {
    id: nanoid(),
    name: '⭐ Star',
    description: 'You\'re a star!',
    price: '1.99',
    category: 'basic',
    displayOrder: 4,
  },
  {
    id: nanoid(),
    name: '🎉 Party Popper',
    description: 'Let\'s celebrate!',
    price: '3.99',
    category: 'celebration',
    displayOrder: 5,
  },
  {
    id: nanoid(),
    name: '👑 Crown',
    description: 'For the royalty!',
    price: '9.99',
    category: 'premium',
    displayOrder: 6,
  },
  {
    id: nanoid(),
    name: '💎 Diamond',
    description: 'The ultimate gift!',
    price: '19.99',
    category: 'premium',
    displayOrder: 7,
  },
  {
    id: nanoid(),
    name: '🚀 Rocket',
    description: 'To the moon!',
    price: '7.99',
    category: 'special',
    displayOrder: 8,
  },
  {
    id: nanoid(),
    name: '🔥 Fire',
    description: 'You\'re on fire!',
    price: '2.49',
    category: 'basic',
    displayOrder: 9,
  },
  {
    id: nanoid(),
    name: '🌟 Sparkles',
    description: 'Shine bright!',
    price: '1.49',
    category: 'basic',
    displayOrder: 10,
  },
];

await db.insert(virtualGifts).values(giftsToCreate);
console.log(`✅ Created ${giftsToCreate.length} virtual gifts`);

// ============================================================================
// STEP 4: Create Live Shows
// ============================================================================

console.log('Creating live shows...');

const now = new Date();
const showsToCreate = [];

// Create 5 LIVE shows
for (let i = 0; i < 5; i++) {
  const hostProfile = hostProfilesToCreate[i];
  const startTime = new Date(now.getTime() - Math.random() * 3600000); // Started within last hour
  
  showsToCreate.push({
    id: nanoid(),
    hostId: hostUsers[i].id,
    title: [
      '🔥 Flash Sale: 50% Off Fashion Collection!',
      '📱 New iPhone 15 Unboxing & Giveaway',
      '💄 Beauty Haul: Testing Viral Products',
      '🏡 Home Makeover: Budget-Friendly Decor',
      '💪 Fitness Gear Review: Best of 2024'
    ][i],
    description: [
      'Exclusive deals on trending fashion items! Limited stock available. Don\'t miss out!',
      'Live unboxing of the latest iPhone with exclusive discount codes for viewers!',
      'Testing the most viral beauty products from TikTok. Real reviews, real results!',
      'Transform your space with these affordable home decor finds under $50!',
      'Reviewing the best fitness equipment and activewear for your 2024 goals!'
    ][i],
    status: 'live',
    scheduledStartAt: startTime,
    actualStartAt: startTime,
    streamKey: nanoid(32),
    peakViewers: Math.floor(Math.random() * 500) + 100,
    totalViews: Math.floor(Math.random() * 2000) + 500,
    totalMessages: Math.floor(Math.random() * 1000) + 200,
    totalGifts: Math.floor(Math.random() * 100) + 20,
    totalRevenue: (Math.random() * 5000 + 1000).toFixed(2),
    settings: {
      allowChat: true,
      allowGifts: true,
      moderationEnabled: false,
      recordingEnabled: true,
    },
  });
}

// Create 15 SCHEDULED shows
for (let i = 0; i < 15; i++) {
  const hostIndex = i % hostUsers.length;
  const scheduledTime = new Date(now.getTime() + (i + 1) * 3600000 * 2); // Every 2 hours
  
  showsToCreate.push({
    id: nanoid(),
    hostId: hostUsers[hostIndex].id,
    title: [
      '🎮 Gaming Setup Tour & Gear Review',
      '📚 Book Club: Monthly Favorites',
      '✈️ Travel Essentials: Pack Like a Pro',
      '🐶 Pet Care: Best Products for Dogs',
      '🍳 Kitchen Gadgets You Need',
      '🎨 Art Supplies Haul & Demo',
      '🏃 Running Gear: Marathon Prep',
      '💻 Work From Home Setup Ideas',
      '🎵 Music Equipment Review',
      '🌱 Plant Care: Indoor Garden Tips',
      '🎭 Cosplay Materials & Techniques',
      '📷 Photography Gear Essentials',
      '🎪 Party Supplies & Decorations',
      '🧘 Yoga & Meditation Essentials',
      '🎬 Film Equipment for Beginners'
    ][i],
    description: 'Join me for an exciting live shopping experience with exclusive deals!',
    status: 'scheduled',
    scheduledStartAt: scheduledTime,
    streamKey: nanoid(32),
    settings: {
      allowChat: true,
      allowGifts: true,
      moderationEnabled: false,
      recordingEnabled: true,
    },
  });
}

// Create 30 ENDED shows
for (let i = 0; i < 30; i++) {
  const hostIndex = i % hostUsers.length;
  const startTime = new Date(now.getTime() - (i + 2) * 86400000); // Past days
  const endTime = new Date(startTime.getTime() + Math.random() * 7200000 + 3600000); // 1-3 hours duration
  
  showsToCreate.push({
    id: nanoid(),
    hostId: hostUsers[hostIndex].id,
    title: `Past Show ${i + 1}: Amazing Deals & Products`,
    description: 'This show has ended. Watch the replay!',
    status: 'ended',
    scheduledStartAt: startTime,
    actualStartAt: startTime,
    actualEndAt: endTime,
    streamKey: nanoid(32),
    peakViewers: Math.floor(Math.random() * 1000) + 50,
    totalViews: Math.floor(Math.random() * 5000) + 200,
    totalMessages: Math.floor(Math.random() * 2000) + 100,
    totalGifts: Math.floor(Math.random() * 200) + 10,
    totalRevenue: (Math.random() * 10000 + 500).toFixed(2),
    settings: {
      allowChat: true,
      allowGifts: true,
      moderationEnabled: false,
      recordingEnabled: true,
    },
  });
}

await db.insert(liveShows).values(showsToCreate);
console.log(`✅ Created ${showsToCreate.length} live shows (5 live, 15 scheduled, 30 ended)`);

// ============================================================================
// STEP 5: Create Chat Messages for Live Shows
// ============================================================================

console.log('Creating chat messages...');

const liveShowsOnly = showsToCreate.filter(s => s.status === 'live');
const chatMessages = [];

const sampleMessages = [
  'This is amazing! 😍',
  'How much is that?',
  'Can you show the blue one?',
  'Just ordered! Thank you! 🎉',
  'What\'s the shipping time?',
  'Love this! ❤️',
  'Is there a discount code?',
  'This looks great!',
  'Can you zoom in?',
  'What sizes are available?',
  'I bought this last week, it\'s awesome!',
  'Does it come in other colors?',
  'How\'s the quality?',
  'Adding to cart now! 🛒',
  'This is exactly what I needed!',
  'Can you compare it to the other one?',
  'What\'s the return policy?',
  'Is it waterproof?',
  'Perfect for gifts! 🎁',
  'How many are left in stock?',
];

for (const show of liveShowsOnly) {
  const messageCount = Math.floor(Math.random() * 100) + 50;
  
  for (let i = 0; i < messageCount; i++) {
    const viewerIndex = Math.floor(Math.random() * 100);
    const viewerId = 2000 + viewerIndex + 1;
    const messageTime = new Date(show.actualStartAt.getTime() + i * 60000); // Every minute
    
    chatMessages.push({
      id: nanoid(),
      showId: show.id,
      userId: viewerId,
      message: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
      messageType: 'text',
      createdAt: messageTime,
    });
  }
}

// Insert in batches
const batchSize = 100;
for (let i = 0; i < chatMessages.length; i += batchSize) {
  const batch = chatMessages.slice(i, i + batchSize);
  await db.insert(liveChatMessages).values(batch);
}

console.log(`✅ Created ${chatMessages.length} chat messages`);

// ============================================================================
// STEP 6: Create Viewers for Live Shows
// ============================================================================

console.log('Creating viewers...');

const viewers = [];

for (const show of liveShowsOnly) {
  const viewerCount = Math.floor(Math.random() * 50) + 20;
  
  for (let i = 0; i < viewerCount; i++) {
    const viewerIndex = Math.floor(Math.random() * 100);
    const viewerId = 2000 + viewerIndex + 1;
    const joinTime = new Date(show.actualStartAt.getTime() + i * 120000); // Join every 2 minutes
    
    viewers.push({
      id: nanoid(),
      showId: show.id,
      userId: viewerId,
      joinedAt: joinTime,
      watchDuration: Math.floor(Math.random() * 3600) + 300, // 5-65 minutes
      messagesCount: Math.floor(Math.random() * 10),
      giftsCount: Math.floor(Math.random() * 3),
    });
  }
}

// Insert in batches
for (let i = 0; i < viewers.length; i += batchSize) {
  const batch = viewers.slice(i, i + batchSize);
  await db.insert(liveViewers).values(batch);
}

console.log(`✅ Created ${viewers.length} viewers`);

// ============================================================================
// STEP 7: Create Gift Transactions
// ============================================================================

console.log('Creating gift transactions...');

const giftTransactions = [];

for (const show of liveShowsOnly) {
  const giftCount = Math.floor(Math.random() * 30) + 10;
  
  for (let i = 0; i < giftCount; i++) {
    const gift = giftsToCreate[Math.floor(Math.random() * giftsToCreate.length)];
    const senderIndex = Math.floor(Math.random() * 100);
    const senderId = 2000 + senderIndex + 1;
    const quantity = Math.floor(Math.random() * 3) + 1;
    const totalPrice = (parseFloat(gift.price) * quantity).toFixed(2);
    
    giftTransactions.push({
      id: nanoid(),
      showId: show.id,
      giftId: gift.id,
      senderId,
      recipientId: show.hostId,
      quantity,
      totalPrice,
      createdAt: new Date(show.actualStartAt.getTime() + i * 180000), // Every 3 minutes
    });
  }
}

// Insert in batches
for (let i = 0; i < giftTransactions.length; i += batchSize) {
  const batch = giftTransactions.slice(i, i + batchSize);
  await db.insert(liveGiftTransactions).values(batch);
}

console.log(`✅ Created ${giftTransactions.length} gift transactions`);

// ============================================================================
// STEP 8: Create Host Followers
// ============================================================================

console.log('Creating host followers...');

const followers = [];

for (const hostProfile of hostProfilesToCreate) {
  const followerCount = Math.floor(Math.random() * 50) + 10;
  
  for (let i = 0; i < followerCount; i++) {
    const viewerIndex = Math.floor(Math.random() * 100);
    const followerId = 2000 + viewerIndex + 1;
    
    followers.push({
      id: nanoid(),
      hostId: hostProfile.id,
      followerId,
      notificationsEnabled: Math.random() > 0.3, // 70% have notifications on
    });
  }
}

// Insert in batches
for (let i = 0; i < followers.length; i += batchSize) {
  const batch = followers.slice(i, i + batchSize);
  await db.insert(hostFollowers).values(batch);
}

console.log(`✅ Created ${followers.length} host followers`);

// ============================================================================
// DONE
// ============================================================================

console.log('\n🎉 Live streaming demo data seeded successfully!');
console.log(`
📊 Summary:
- ${demoUsers.length} demo users (10 hosts + 100 viewers)
- ${hostProfilesToCreate.length} host profiles
- ${giftsToCreate.length} virtual gifts
- ${showsToCreate.length} live shows (5 live, 15 scheduled, 30 ended)
- ${chatMessages.length} chat messages
- ${viewers.length} viewers
- ${giftTransactions.length} gift transactions
- ${followers.length} host followers

🚀 Your live shopping platform is now populated with demo data!
`);

process.exit(0);
