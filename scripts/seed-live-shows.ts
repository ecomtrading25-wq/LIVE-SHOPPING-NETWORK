import { getDb } from "../server/db";
import { nanoid } from "nanoid";
import {
  users,
  liveShows,
  hostProfiles,
  liveShowProducts,
  creators,
  creatorTiers,
} from "../drizzle/schema";

console.log("🎬 Starting live shows and creators seeding...");

async function seedLiveShows() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Database connection failed");
    process.exit(1);
  }

  try {
    // 1. Create creator tiers first
    console.log("🏆 Creating creator tiers...");
    const tierData = [
      {
        id: nanoid(),
        name: "Bronze",
        minSales: 0,
        maxSales: 10000,
        commissionRate: "0.05",
        bonusRate: "0.01",
        perks: JSON.stringify(["Basic analytics", "Standard support"]),
      },
      {
        id: nanoid(),
        name: "Silver",
        minSales: 10000,
        maxSales: 50000,
        commissionRate: "0.08",
        bonusRate: "0.02",
        perks: JSON.stringify(["Advanced analytics", "Priority support", "Featured placement"]),
      },
      {
        id: nanoid(),
        name: "Gold",
        minSales: 50000,
        maxSales: 100000,
        commissionRate: "0.10",
        bonusRate: "0.03",
        perks: JSON.stringify(["Premium analytics", "Dedicated manager", "Prime time slots"]),
      },
    ];

    await db.insert(creatorTiers).values(tierData).onDuplicateKeyUpdate({ set: { id: tierData[0].id } });
    console.log(`✅ Created ${tierData.length} creator tiers`);

    // 1.5. Create users for hosts (required for foreign key)
    console.log("👤 Creating users for hosts...");
    const userData = [
      { id: 1, openId: "host-sarah-tech", name: "Sarah Tech", email: "sarah@liveshow.com", role: "user" as const },
      { id: 2, openId: "host-emma-style", name: "Emma Style", email: "emma@liveshow.com", role: "user" as const },
      { id: 3, openId: "host-lisa-home", name: "Lisa Home", email: "lisa@liveshow.com", role: "user" as const },
      { id: 4, openId: "host-mike-fitness", name: "Mike Fitness", email: "mike@liveshow.com", role: "user" as const },
      { id: 5, openId: "host-anna-beauty", name: "Anna Beauty", email: "anna@liveshow.com", role: "user" as const },
    ];

    for (const user of userData) {
      try {
        await db.insert(users).values(user).onDuplicateKeyUpdate({ set: { openId: user.openId } });
      } catch (error: any) {
        // Ignore duplicate key errors
        if (error.code !== 'ER_DUP_ENTRY') {
          throw error;
        }
      }
    }
    console.log(`✅ Created ${userData.length} users for hosts`);

    // 2. Create creators
    console.log("👥 Creating creators...");
    const creatorData = [
      {
        id: nanoid(),
        name: "Sarah Tech",
        email: "sarah@liveshow.com",
        tierId: tierData[2].id, // Gold tier
        totalRevenue: "125000.50",
        totalCommission: "12500.05",
        status: "active" as const,
      },
      {
        id: nanoid(),
        name: "Emma Style",
        email: "emma@liveshow.com",
        tierId: tierData[1].id, // Silver tier
        totalRevenue: "45000.00",
        totalCommission: "3600.00",
        status: "active" as const,
      },
      {
        id: nanoid(),
        name: "Lisa Home",
        email: "lisa@liveshow.com",
        tierId: tierData[1].id, // Silver tier
        totalRevenue: "38000.00",
        totalCommission: "3040.00",
        status: "active" as const,
      },
      {
        id: nanoid(),
        name: "Mike Fitness",
        email: "mike@liveshow.com",
        tierId: tierData[0].id, // Bronze tier
        totalRevenue: "8500.00",
        totalCommission: "425.00",
        status: "active" as const,
      },
      {
        id: nanoid(),
        name: "Anna Beauty",
        email: "anna@liveshow.com",
        tierId: tierData[0].id, // Bronze tier
        totalRevenue: "6200.00",
        totalCommission: "310.00",
        status: "active" as const,
      },
    ];

    await db.insert(creators).values(creatorData).onDuplicateKeyUpdate({ set: { id: creatorData[0].id } });
    console.log(`✅ Created ${creatorData.length} creators`);

    // 3. Create host profiles
    console.log("🎤 Creating host profiles...");
    const hostData = [
      {
        id: nanoid(),
        userId: 1, // Assuming user ID 1 exists or will be created
        displayName: "Sarah Tech",
        bio: "Tech enthusiast sharing the latest gadgets and deals. 5+ years of live shopping experience.",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        totalShows: 245,
        totalViewers: 125000,
        totalRevenue: "125000.50",
        rating: "4.9",
        followerCount: 15000,
        status: "active" as const,
      },
      {
        id: nanoid(),
        userId: 2,
        displayName: "Emma Style",
        bio: "Fashion and lifestyle expert bringing you the hottest trends and exclusive deals.",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
        totalShows: 189,
        totalViewers: 98000,
        totalRevenue: "98000.00",
        rating: "4.8",
        followerCount: 12000,
        status: "active" as const,
      },
      {
        id: nanoid(),
        userId: 3,
        displayName: "Lisa Home",
        bio: "Home decor specialist helping you create your dream space on a budget.",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
        totalShows: 156,
        totalViewers: 78000,
        totalRevenue: "78000.00",
        rating: "4.7",
        followerCount: 9500,
        status: "active" as const,
      },
      {
        id: nanoid(),
        userId: 4,
        displayName: "Mike Fitness",
        bio: "Fitness coach and sports equipment expert. Get fit with the best gear!",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
        totalShows: 134,
        totalViewers: 67000,
        totalRevenue: "67000.00",
        rating: "4.6",
        followerCount: 8200,
        status: "active" as const,
      },
      {
        id: nanoid(),
        userId: 5,
        displayName: "Anna Beauty",
        bio: "Beauty guru sharing skincare secrets and makeup must-haves.",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna",
        totalShows: 98,
        totalViewers: 45000,
        totalRevenue: "45000.00",
        rating: "4.8",
        followerCount: 7800,
        status: "active" as const,
      },
    ];

    await db.insert(hostProfiles).values(hostData).onDuplicateKeyUpdate({ set: { id: hostData[0].id } });
    console.log(`✅ Created ${hostData.length} host profiles`);

    // 4. Create live shows
    console.log("📺 Creating live shows...");
    
    // Live shows (currently live)
    const liveShowsData = [
      {
        id: nanoid(),
        hostId: hostData[0].id,
        title: "Tech Gadgets Flash Sale",
        description: "Exclusive deals on the latest tech gadgets! Limited quantities available.",
        thumbnailUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800",
        status: "live" as const,
        scheduledStartTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 min ago
        actualStartTime: new Date(Date.now() - 30 * 60 * 1000),
        viewerCount: 1247,
        peakViewerCount: 1500,
        totalRevenue: "12450.00",
      },
      {
        id: nanoid(),
        hostId: hostData[1].id,
        title: "Fashion Friday Deals",
        description: "Trendy fashion items at unbeatable prices. Don't miss out!",
        thumbnailUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800",
        status: "live" as const,
        scheduledStartTime: new Date(Date.now() - 15 * 60 * 1000), // Started 15 min ago
        actualStartTime: new Date(Date.now() - 15 * 60 * 1000),
        viewerCount: 892,
        peakViewerCount: 950,
        totalRevenue: "8920.00",
      },
    ];

    // Upcoming shows
    const upcomingShowsData = [
      {
        id: nanoid(),
        hostId: hostData[2].id,
        title: "Home Decor Showcase",
        description: "Transform your living space with these amazing home decor items.",
        thumbnailUrl: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800",
        status: "scheduled" as const,
        scheduledStartTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // In 2 hours
        viewerCount: 0,
        peakViewerCount: 0,
        totalRevenue: "0",
      },
      {
        id: nanoid(),
        hostId: hostData[3].id,
        title: "Sports Equipment Sale",
        description: "Get fit with premium sports equipment at discounted prices.",
        thumbnailUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
        status: "scheduled" as const,
        scheduledStartTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // In 4 hours
        viewerCount: 0,
        peakViewerCount: 0,
        totalRevenue: "0",
      },
      {
        id: nanoid(),
        hostId: hostData[4].id,
        title: "Beauty Products Review",
        description: "Discover the best beauty products and skincare essentials.",
        thumbnailUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800",
        status: "scheduled" as const,
        scheduledStartTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // In 6 hours
        viewerCount: 0,
        peakViewerCount: 0,
        totalRevenue: "0",
      },
    ];

    const allShows = [...liveShowsData, ...upcomingShowsData];
    await db.insert(liveShows).values(allShows).onDuplicateKeyUpdate({ set: { id: allShows[0].id } });
    console.log(`✅ Created ${allShows.length} live shows (${liveShowsData.length} live, ${upcomingShowsData.length} upcoming)`);

    console.log("\n🎉 Live shows and creators seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  - ${tierData.length} creator tiers`);
    console.log(`  - ${creatorData.length} creators`);
    console.log(`  - ${hostData.length} host profiles`);
    console.log(`  - ${liveShowsData.length} live shows`);
    console.log(`  - ${upcomingShowsData.length} upcoming shows`);

  } catch (error) {
    console.error("\n❌ Error seeding live shows:", error);
    process.exit(1);
  }
}

seedLiveShows();
