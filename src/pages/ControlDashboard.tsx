import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Instagram,
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  Image as ImageIcon,
  Calendar,
  AlertTriangle,
  Video,
  Sparkles,
  BarChart3,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Globe,
  Facebook,
} from "lucide-react";
import GA4DashboardContent from "../components/ga4/GA4DashboardContent";

// General account metrics
interface GeneralMetrics {
  username: string;
  new_followers: number;
  accounts_reached: number;
  profile_views: number;
  profile_reach: number;
  profile_links_taps: number;
  current_followers: number;
  current_follows: number;
  profile_media_count: number;
}

// Dataslayer API response types (43 metrics total)
interface InstagramInsights {
  username: string;
  // Media metrics (posts)
  media_count: number;
  media_likes: number;
  media_comments: number;
  media_follows: number;
  media_shares: number;
  media_profile_visits: number;
  media_total_interactions: number;
  media_engagement_rate: number;
  media_views: number;
  media_reach: number;
  media_unique_saves: number;
  // Reel metrics
  reel_comments: number;
  reel_likes: number;
  reel_reach: number;
  reel_saved_times: number;
  reel_shared_times: number;
  reel_views: number;
  reel_total_interactions: number;
  reel_total_interactions_rate: number;
  reel_average_watch_time: number;
  reel_total_video_view_time: number;
  // Story metrics
  story_views: number;
  story_follows: number;
  story_profile_visits: number;
  story_shares: number;
  story_total_interactions: number;
  story_reach: number;
  story_exits: number;
  story_replies: number;
  story_taps_forward: number;
  story_taps_back: number;
  story_swipe_forward: number;
  story_profile_activity_email: number;
  story_profile_activity_text: number;
  story_profile_activity_direction: number;
  story_profile_activity_bio_link_clicked: number;
  story_total_actions: number;
  story_average_completion_rate: number;
  // Carousel metrics
  carousel_total_interactions: number;
  carousel_views: number;
  carousel_reach: number;
  carousel_unique_saves: number;
}

interface DataslayerResponse {
  result: [string[], (string | number)[]];
}

interface DemographicsResponse {
  result: [string[], ...(string | number)[][]];
}

interface AgeDemographic {
  ageRange: string;
  count: number;
  percentage: number;
}

interface GenderDemographic {
  gender: string;
  count: number;
  percentage: number;
}

interface FacebookPost {
  postName: string;
  postType: string;
  postEngagements: number;
  postEngagementRate: number;
  postLikes: number;
  postComments: number;
  postShares: number;
  pageConsumptions: number;
}

const ControlDashboard = () => {
  const [searchParams] = useSearchParams();
  const clientSlug = searchParams.get("client") || "";

  const [insights, setInsights] = useState<InstagramInsights | null>(null);
  const [generalMetrics, setGeneralMetrics] = useState<GeneralMetrics | null>(null);
  const [ageDemographics, setAgeDemographics] = useState<AgeDemographic[]>([]);
  const [genderDemographics, setGenderDemographics] = useState<GenderDemographic[]>([]);
  const [facebookPosts, setFacebookPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<"last7days" | "last30days" | "thismonth">("thismonth");
  const [activeTab, setActiveTab] = useState<"instagram" | "facebook" | "website">("instagram");

  // Client-specific dataslayer configurations
  const clientConfigs: Record<string, {
    name: string;
    username: string;
    dataslayerUrls?: Record<string, string>;
  }> = {
    imogen: {
      name: "Inside Out Style",
      username: "@insideoutstyle",
      dataslayerUrls: {
        // Content metrics
        thismonth: 'https://query-manager.dataslayer.ai/get_results/6eb3f4b6ea03aed5fa057c029f9f513e6fc8fa432442b588efd3ec4cc16344ec:42d8a00689f945deb5b115952404a040?output_type=json',
        last30days: 'https://query-manager.dataslayer.ai/get_results/36e8a4d2816eb08ecdce9aa2b5161db87f1c4e50ce92058c8bc3d1b4ca6ff45d:02b9e645810d41839081583840e8f958?output_type=json',
        last7days: 'https://query-manager.dataslayer.ai/get_results/e1bb296a16abcd6e6027dd62640dad34795ded1c54de1adebc3f78cdbb16a951:018eeb7a8434456898f4aaf4c1f0cf2f?output_type=json',
        // General account metrics
        general_thismonth: 'https://query-manager.dataslayer.ai/get_results/4bd96536dacc4e4cc89707b217a69f9712c47145c04a0fe9aa7b72ab2b888f1c:2d09e3d1e4b54d85a593a7b8043a25d3?output_type=json',
        general_last30days: 'https://query-manager.dataslayer.ai/get_results/a7c44f7cf60b79fe8204cff4aa65b4be3fb8d6303b0f3bfbc7cf8e97d55566d1:7ba5f2e0e4af4c63b3cc0535dcc7b76f?output_type=json',
        general_last7days: 'https://query-manager.dataslayer.ai/get_results/3a9381703aeeefd7a28eb9851e405868ed8fab1992c204d890554c32dc9c3671:bf2b7bcd8ca3413295e39b52d173f387?output_type=json',
      },
    },
  };

  useEffect(() => {
    if (!clientSlug || !clientConfigs[clientSlug]) return;

    const fetchDataslayerData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Dev mode: call Dataslayer directly, Prod: use proxy
        const isDev = import.meta.env.DEV;

        // Fetch content metrics and general metrics in parallel
        const contentUrl = isDev
          ? clientConfigs[clientSlug].dataslayerUrls[timePeriod]
          : `/api/dataslayer-proxy?client=${clientSlug}&period=${timePeriod}`;
        const generalUrl = isDev
          ? clientConfigs[clientSlug].dataslayerUrls[`general_${timePeriod}`]
          : `/api/dataslayer-proxy?client=${clientSlug}&period=general_${timePeriod}`;

        const [contentResponse, generalResponse] = await Promise.all([
          fetch(contentUrl),
          fetch(generalUrl),
        ]);

        if (!contentResponse.ok) {
          throw new Error(`Content proxy error: ${contentResponse.status} ${contentResponse.statusText}`);
        }

        if (!generalResponse.ok) {
          throw new Error(`General proxy error: ${generalResponse.status} ${generalResponse.statusText}`);
        }

        const data: DataslayerResponse = await contentResponse.json();
        const generalData: DataslayerResponse = await generalResponse.json();

        // Parse dataslayer response format
        // result[0] = headers, result[1] = values
        if (!data.result || data.result.length < 2) {
          throw new Error("Invalid dataslayer response format");
        }

        const [headers, values] = data.result;

        // Map array values to object (43 metrics)
        const parsedInsights: InstagramInsights = {
          username: String(values[0]),
          // Media metrics (indices 1-11)
          media_count: Number(values[1]),
          media_likes: Number(values[2]),
          media_comments: Number(values[3]),
          media_follows: Number(values[4]),
          media_shares: Number(values[5]),
          media_profile_visits: Number(values[6]),
          media_total_interactions: Number(values[7]),
          media_engagement_rate: Number(values[8]),
          media_views: Number(values[9]),
          media_reach: Number(values[10]),
          media_unique_saves: Number(values[11]),
          // Reel metrics (indices 12-21)
          reel_comments: Number(values[12]),
          reel_likes: Number(values[13]),
          reel_reach: Number(values[14]),
          reel_saved_times: Number(values[15]),
          reel_shared_times: Number(values[16]),
          reel_views: Number(values[17]),
          reel_total_interactions: Number(values[18]),
          reel_total_interactions_rate: Number(values[19]),
          reel_average_watch_time: Number(values[20]),
          reel_total_video_view_time: Number(values[21]),
          // Story metrics (indices 22-38)
          story_views: Number(values[22]),
          story_follows: Number(values[23]),
          story_profile_visits: Number(values[24]),
          story_shares: Number(values[25]),
          story_total_interactions: Number(values[26]),
          story_reach: Number(values[27]),
          story_exits: Number(values[28]),
          story_replies: Number(values[29]),
          story_taps_forward: Number(values[30]),
          story_taps_back: Number(values[31]),
          story_swipe_forward: Number(values[32]),
          story_profile_activity_email: Number(values[33]),
          story_profile_activity_text: Number(values[34]),
          story_profile_activity_direction: Number(values[35]),
          story_profile_activity_bio_link_clicked: Number(values[36]),
          story_total_actions: Number(values[37]),
          story_average_completion_rate: Number(values[38]),
          // Carousel metrics (indices 39-42)
          carousel_total_interactions: Number(values[39]),
          carousel_views: Number(values[40]),
          carousel_reach: Number(values[41]),
          carousel_unique_saves: Number(values[42]),
        };

        setInsights(parsedInsights);

        // Parse general metrics
        if (!generalData.result || generalData.result.length < 2) {
          throw new Error("Invalid general metrics response format");
        }

        const [generalHeaders, generalValues] = generalData.result;

        const parsedGeneral: GeneralMetrics = {
          username: String(generalValues[0]),
          new_followers: Number(generalValues[1]),
          accounts_reached: Number(generalValues[2]),
          profile_views: Number(generalValues[3]),
          profile_reach: Number(generalValues[4]),
          profile_links_taps: Number(generalValues[5]),
          current_followers: Number(generalValues[6]),
          current_follows: Number(generalValues[7]),
          profile_media_count: Number(generalValues[8]),
        };

        setGeneralMetrics(parsedGeneral);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDataslayerData();
  }, [clientSlug, timePeriod]);

  // Fetch demographics (separate from time-period metrics)
  useEffect(() => {
    if (!clientSlug || !clientConfigs[clientSlug]) return;

    const fetchDemographics = async () => {
      try {
        // Fetch age demographics
        const ageResponse = await fetch(`/api/dataslayer-proxy?client=${clientSlug}&period=age`);
        if (ageResponse.ok) {
          const ageData: DemographicsResponse = await ageResponse.json();
          if (ageData.result && ageData.result.length > 1) {
            const [headers, ...rows] = ageData.result;
            const total = rows.reduce((sum, row) => sum + Number(row[1]), 0);
            const ageDemo = rows
              .filter(row => String(row[0]) !== 'Unknown')
              .map(row => ({
                ageRange: String(row[0]),
                count: Number(row[1]),
                percentage: (Number(row[1]) / total) * 100
              }))
              .sort((a, b) => b.count - a.count);
            setAgeDemographics(ageDemo);
          }
        }

        // Fetch gender demographics
        const genderResponse = await fetch(`/api/dataslayer-proxy?client=${clientSlug}&period=gender`);
        if (genderResponse.ok) {
          const genderData: DemographicsResponse = await genderResponse.json();
          if (genderData.result && genderData.result.length > 1) {
            const [headers, ...rows] = genderData.result;
            const total = rows.reduce((sum, row) => sum + Number(row[1]), 0);
            const genderLabels: Record<string, string> = {
              'F': 'Female',
              'M': 'Male',
              'U': 'Unspecified'
            };
            const genderDemo = rows
              .filter(row => String(row[0]) !== 'Unknown')
              .map(row => ({
                gender: genderLabels[String(row[0])] || String(row[0]),
                count: Number(row[1]),
                percentage: (Number(row[1]) / total) * 100
              }))
              .sort((a, b) => b.count - a.count);
            setGenderDemographics(genderDemo);
          }
        }
      } catch (err) {
        console.error('Error fetching demographics:', err);
      }
    };

    fetchDemographics();
  }, [clientSlug]);

  // Fetch Facebook posts
  useEffect(() => {
    if (!clientSlug || !clientConfigs[clientSlug]) return;

    const fetchFacebook = async () => {
      try {
        const res = await fetch(`/api/dataslayer-proxy?client=${clientSlug}&type=facebook_posts&period=${timePeriod}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.result || data.result.length < 2) return;

        const [, ...rows] = data.result;
        // Columns: post_id(0), post_name(1), post_permalink_url(2), post_type(3), post_message(4),
        // post_story(5), post_description(6), post_status_type(7), post_privacy(8), post_link(9),
        // post_unshimmed_link(10), post_object_id(11), post_picture(12), post_picture_image(13),
        // post_full_picture(14), post_full_picture_image(15), post_video_length(16),
        // post_created_time_of_day(17), page_consumptions(18), post_engagements(19),
        // post_engagement_rate(20), post_comments(21), post_shares(22), post_likes(23)
        const posts: FacebookPost[] = rows
          .map((row: (string | number)[]) => ({
            postName: String(row[1]) || String(row[4]) || "Untitled",
            postType: String(row[3]),
            postEngagements: Number(row[19]) || 0,
            postEngagementRate: Number(row[20]) || 0,
            postLikes: Number(row[23]) || 0,
            postComments: Number(row[21]) || 0,
            postShares: Number(row[22]) || 0,
            pageConsumptions: Number(row[18]) || 0,
          }))
          .filter((p: FacebookPost) => p.postEngagements > 0)
          .sort((a: FacebookPost, b: FacebookPost) => b.postEngagements - a.postEngagements)
          .slice(0, 10);
        setFacebookPosts(posts);
      } catch (err) {
        console.error("Error fetching Facebook posts:", err);
      }
    };

    fetchFacebook();
  }, [clientSlug, timePeriod]);

  if (!clientSlug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center mx-auto mb-4">
            <Instagram className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">No Client Selected</h1>
          <p className="text-muted-foreground">
            Add <code className="bg-muted px-2 py-0.5 rounded text-sm">?client=name</code> to the URL to load analytics.
          </p>
        </div>
      </div>
    );
  }

  if (!clientConfigs[clientSlug]) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Client Not Configured</h1>
          <p className="text-muted-foreground">
            No analytics configuration found for <strong>"{clientSlug}"</strong>.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Pulsing Instagram Logo */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg"
          >
            <Instagram className="w-10 h-10 text-white" />
          </motion.div>

          {/* Loading Text */}
          <div className="text-center space-y-2">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold text-foreground"
            >
              Loading Analytics
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-muted-foreground"
            >
              Fetching Instagram insights...
            </motion.p>
          </div>

          {/* Progress Dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Data</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const config = clientConfigs[clientSlug];

  if (!insights) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Instagram className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">No Data Available</h1>
          <p className="text-muted-foreground">No Instagram insights found for this account.</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;

    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // For very large values (>= 1 day)
    if (days >= 1) {
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }

    // For medium values (>= 1 hour)
    if (hours >= 1) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }

    // For small values (< 1 hour)
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Media (Posts) Metrics
  const mediaMetrics = [
    {
      label: "Posts",
      value: insights.media_count,
      icon: ImageIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Post Reach",
      value: insights.media_reach,
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Post Views",
      value: insights.media_views,
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Post Likes",
      value: insights.media_likes,
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      label: "Post Comments",
      value: insights.media_comments,
      icon: MessageCircle,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      label: "Post Saves",
      value: insights.media_unique_saves,
      icon: Bookmark,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  // Reel Metrics
  const reelMetrics = [
    {
      label: "Reel Views",
      value: insights.reel_views,
      icon: Video,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Reel Reach",
      value: insights.reel_reach,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Reel Likes",
      value: insights.reel_likes,
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      label: "Reel Comments",
      value: insights.reel_comments,
      icon: MessageCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Reel Shares",
      value: insights.reel_shared_times,
      icon: Share2,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      label: "Reel Saves",
      value: insights.reel_saved_times,
      icon: Bookmark,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  // Story Metrics
  const storyMetrics = [
    {
      label: "Story Views",
      value: insights.story_views,
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Story Reach",
      value: insights.story_reach,
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Story Replies",
      value: insights.story_replies,
      icon: MessageCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Story Shares",
      value: insights.story_shares,
      icon: Share2,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      label: "Profile Visits",
      value: insights.story_profile_visits,
      icon: MousePointerClick,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      label: "Story Exits",
      value: insights.story_exits,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  // Carousel Metrics
  const carouselMetrics = [
    {
      label: "Carousel Views",
      value: insights.carousel_views,
      icon: ImageIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Carousel Reach",
      value: insights.carousel_reach,
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Carousel Interactions",
      value: insights.carousel_total_interactions,
      icon: MousePointerClick,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Carousel Saves",
      value: insights.carousel_unique_saves,
      icon: Bookmark,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-widest">
                  Analytics Dashboard
                </p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
                  {config.name}
                </h1>
              </div>
            </div>
            {activeTab !== 'website' && (
              <p className="text-muted-foreground">
                {config.username} • @{insights.username}
              </p>
            )}

            {/* Tab Navigation */}
            <div className="flex border-b border-border mt-6 -mb-8 md:-mb-12">
              {([
                { id: "instagram", label: "Instagram", icon: Instagram },
                { id: "facebook", label: "Facebook", icon: Facebook },
                { id: "website", label: "Website", icon: Globe },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {activeTab === "instagram" && (
          <>
        {/* Time Period Selector */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />

            {/* Desktop: Full labels */}
            <div
              role="group"
              aria-label="Time period selector"
              className="hidden sm:inline-flex items-center bg-muted rounded-lg p-1 gap-1"
            >
              <button
                onClick={() => setTimePeriod("last7days")}
                className={`
                  px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${timePeriod === "last7days"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
                aria-pressed={timePeriod === "last7days"}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimePeriod("last30days")}
                className={`
                  px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${timePeriod === "last30days"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
                aria-pressed={timePeriod === "last30days"}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setTimePeriod("thismonth")}
                className={`
                  px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${timePeriod === "thismonth"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
                aria-pressed={timePeriod === "thismonth"}
              >
                This Month
              </button>
            </div>

            {/* Mobile: Short labels */}
            <div
              role="group"
              aria-label="Time period selector"
              className="inline-flex sm:hidden items-center bg-muted rounded-lg p-1 gap-1"
            >
              <button
                onClick={() => setTimePeriod("last7days")}
                className={`
                  min-w-[60px] px-3 py-2.5 text-sm font-semibold rounded-md transition-all duration-200
                  ${timePeriod === "last7days"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
                aria-pressed={timePeriod === "last7days"}
                aria-label="Last 7 Days"
              >
                7D
              </button>
              <button
                onClick={() => setTimePeriod("last30days")}
                className={`
                  min-w-[60px] px-3 py-2.5 text-sm font-semibold rounded-md transition-all duration-200
                  ${timePeriod === "last30days"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
                aria-pressed={timePeriod === "last30days"}
                aria-label="Last 30 Days"
              >
                30D
              </button>
              <button
                onClick={() => setTimePeriod("thismonth")}
                className={`
                  min-w-[60px] px-3 py-2.5 text-sm font-semibold rounded-md transition-all duration-200
                  ${timePeriod === "thismonth"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
                aria-pressed={timePeriod === "thismonth"}
                aria-label="This Month"
              >
                MTD
              </button>
            </div>
          </div>
        </motion.section>

        {/* Account Overview */}
        {generalMetrics && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <h2 className="text-lg font-bold text-foreground mb-4">Account Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {formatNumber(generalMetrics.current_followers)}
                </p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Total Followers
                </p>
                <p className="text-xs text-green-600 font-medium">
                  +{formatNumber(generalMetrics.new_followers)} new
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {formatNumber(generalMetrics.accounts_reached)}
                </p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Accounts Reached
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {formatNumber(generalMetrics.profile_views)}
                </p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Profile Views
                </p>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                    <MousePointerClick className="w-5 h-5 text-pink-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {formatNumber(generalMetrics.profile_links_taps)}
                </p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Link Clicks
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Media (Posts) Metrics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-foreground">Posts</h2>
            <span className="text-sm text-muted-foreground">
              {insights.media_engagement_rate.toFixed(2)}% engagement
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {mediaMetrics.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                  className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">
                    {formatNumber(metric.value)}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {metric.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Reels Metrics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-foreground">Reels</h2>
            <span className="text-sm text-muted-foreground">
              {insights.reel_total_interactions_rate.toFixed(2)}% interaction rate
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {reelMetrics.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                  className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">
                    {formatNumber(metric.value)}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {metric.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
          {/* Reel Watch Time Card */}
          <div className="mt-4 bg-card rounded-xl border border-border p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Avg Watch Time per Viewer</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatTime(insights.reel_average_watch_time)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Per person viewing
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Total Watch Time (All Viewers)</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatTime(insights.reel_total_video_view_time)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cumulative across {formatNumber(insights.reel_views)} views
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Stories Metrics */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-foreground">Stories</h2>
            <span className="text-sm text-muted-foreground">
              {insights.story_average_completion_rate.toFixed(1)}% completion rate
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {storyMetrics.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
                  className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${metric.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">
                    {formatNumber(metric.value)}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {metric.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Carousel Metrics */}
        {insights.carousel_views > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-foreground">Carousels</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {carouselMetrics.map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}
                    className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${metric.color}`} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-1">
                      {formatNumber(metric.value)}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {metric.label}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Overall Performance Summary */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-lg font-bold text-foreground mb-4">Performance Summary</h2>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Total Content</p>
                <p className="text-3xl font-bold text-foreground">
                  {insights.media_count + (insights.carousel_views > 0 ? 1 : 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Posts & carousels
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Total Reach</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatNumber(insights.media_reach + insights.reel_reach + insights.story_reach + insights.carousel_reach)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all formats
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Total Engagement</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatNumber(
                    insights.media_total_interactions +
                    insights.reel_total_interactions +
                    insights.story_total_interactions +
                    insights.carousel_total_interactions
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Likes, comments, shares, saves
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Best Performing</p>
                <p className="text-3xl font-bold text-foreground">
                  {insights.reel_total_interactions_rate > insights.media_engagement_rate ? "Reels" : "Posts"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {insights.reel_total_interactions_rate > insights.media_engagement_rate
                    ? `${insights.reel_total_interactions_rate.toFixed(2)}% interaction rate`
                    : `${insights.media_engagement_rate.toFixed(2)}% engagement rate`
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Audience Demographics */}
        {(ageDemographics.length > 0 || genderDemographics.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-foreground">Audience Demographics</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Age Demographics */}
              {ageDemographics.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Age Distribution</h3>
                  <div className="space-y-3">
                    {ageDemographics.slice(0, 6).map((demo, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-foreground">{demo.ageRange}</span>
                          <span className="text-muted-foreground">
                            {formatNumber(demo.count)} ({demo.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${demo.percentage}%` }}
                            transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gender Demographics */}
              {genderDemographics.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Gender Distribution</h3>
                  <div className="space-y-3">
                    {genderDemographics.map((demo, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-foreground">{demo.gender}</span>
                          <span className="text-muted-foreground">
                            {formatNumber(demo.count)} ({demo.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${demo.percentage}%` }}
                            transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                            className={`h-full rounded-full ${
                              demo.gender === 'Female'
                                ? 'bg-gradient-to-r from-pink-500 to-pink-600'
                                : demo.gender === 'Male'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : 'bg-gradient-to-r from-gray-500 to-gray-600'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}

          </>
        )}

        {activeTab === "facebook" && (
          <>
            {facebookPosts.length > 0 ? (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Facebook className="w-5 h-5 text-blue-700" />
                  <h2 className="text-lg font-bold text-foreground">Facebook Posts</h2>
                </div>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <div className="col-span-5">Post</div>
                    <div className="col-span-2 text-right">Engagements</div>
                    <div className="col-span-1 text-right">Likes</div>
                    <div className="col-span-1 text-right">Comments</div>
                    <div className="col-span-1 text-right">Shares</div>
                    <div className="col-span-2 text-right">Eng. Rate</div>
                  </div>
                  {facebookPosts.map((post, i) => (
                    <div key={i} className={`grid grid-cols-12 gap-4 px-6 py-4 text-sm border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                      <div className="col-span-5">
                        <p className="font-medium text-foreground truncate" title={post.postName}>{post.postName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{post.postType.replace(/_/g, " ")}</p>
                      </div>
                      <div className="col-span-2 text-right font-semibold">{formatNumber(post.postEngagements)}</div>
                      <div className="col-span-1 text-right text-pink-600">{formatNumber(post.postLikes)}</div>
                      <div className="col-span-1 text-right text-blue-600">{formatNumber(post.postComments)}</div>
                      <div className="col-span-1 text-right text-cyan-600">{formatNumber(post.postShares)}</div>
                      <div className="col-span-2 text-right text-green-600">{post.postEngagementRate.toFixed(2)}%</div>
                    </div>
                  ))}
                </div>
              </motion.section>
            ) : (
              <div className="text-center py-16 text-muted-foreground">No Facebook posts found for this period.</div>
            )}
          </>
        )}

        {activeTab === "website" && (
          <GA4DashboardContent clientSlug={clientSlug} />
        )}
      </div>
    </div>
  );
};

export default ControlDashboard;
