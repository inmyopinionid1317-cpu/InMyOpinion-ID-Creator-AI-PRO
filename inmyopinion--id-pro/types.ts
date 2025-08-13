/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- TYPE INTERFACES ---
export type TabType = 'dashboard' | 'plan' | 'youtube' | 'instagram' | 'trend' | 'analyzer' | 'prompt_studio' | 'knowledge_hub';

export interface KnowledgeSource {
    id: string;
    name: string;
    content: string;
    status: 'processing' | 'ready' | 'error';
    fileType: string;
    errorMessage?: string;
}

export interface DayPlan { day: number; theme: string; content_idea: string; caption: string; visual_idea: string; hashtags: string[] }
export interface PlanResponse { plan: DayPlan[] }
export interface VisualConcept { style_description: string; image_prompt: string; }
export interface VisualConceptsResponse { concepts: VisualConcept[]; }
export interface GeneratedVisualData { 
    imageUrl: string; 
    prompt: string; 
    generationMethod?: 'standard' | 'veo';
}
export interface GeneratedVisuals { visuals: GeneratedVisualData[]; }
export interface PerformanceMetrics { views: number; likes: number; comments: number; shares: number; saves: number; }
export interface DailyArtifacts {
    visuals?: GeneratedVisuals;
    ebook?: EbookContent;
    uploaded?: boolean;
    metrics?: PerformanceMetrics;
}
export interface PlanData {
    plan: DayPlan[];
    daily_artifacts?: {
        [day: number]: DailyArtifacts;
    }
}
export interface EbookChapter { heading: string; content: string; }
export interface EbookContent {
    cover: { 
        title: string; 
        subtitle: string; 
        image_prompt: string;
        imageBase64?: string; 
    };
    table_of_contents_title: string;
    disclaimer: string;
    inmyopinion_note: string;
    introduction: string;
    chapters: EbookChapter[];
    conclusion: string;
}
export interface YoutubeScene { scene_number: number; visual_description: string; voiceover_narration: string; on_screen_text: string; }
export interface YoutubeShortScript { title: string; hook: string; scenes: YoutubeScene[]; music_suggestion: string; cta: string; }
export interface GeneratedYoutubeVideo {
    script: YoutubeShortScript;
    scene_images: { imageUrl: string; prompt: string; }[];
    generationMethod: 'standard' | 'veo';
}
export interface InstagramReelScene { scene_number: number; visual_description: string; voiceover_narration: string; on_screen_text: string; }
export interface InstagramReelsScript { hook: string; audio_suggestion: string; scenes: InstagramReelScene[]; hashtags: string[]; cta: string; }
export interface GeneratedReelVisual { 
    script: InstagramReelsScript; 
    visual: GeneratedVisualData;
    generationMethod: 'standard' | 'veo';
}
export interface TrendIdea {
    trend_name: string;
    fyp_potential_reason: string;
    fused_idea_title: string;
    content_angle: string;
}
export interface TrendFusionResponse { ideas: TrendIdea[] }
export interface InstagramCarouselSlide { slide_number: number; slide_text: string; }
export interface TwitterThreadTweet { tweet_number: number; tweet_text: string; }
export interface BlogArticle { title: string; introduction: string; body: string; }
export interface MultiplierResult {
    instagram_carousel?: { slides: InstagramCarouselSlide[]; caption: string; };
    twitter_thread?: { tweets: TwitterThreadTweet[]; };
    blog_article?: BlogArticle;
}
export interface MultiplierResponse { results: MultiplierResult; }
export interface GrowthInsight {
    finding: string;
    recommendation: string;
    actionable_idea: {
        type: 'youtube_short' | 'instagram_reel' | 'content_plan_series';
        content_idea: string;
        theme?: string;
    };
}
export interface PerformanceAnalysisResponse { insights: GrowthInsight[]; }
export interface PromptVariation {
    title: string;
    prompt: string;
    negative_prompt?: string;
}
export interface PromptStudioResponse { prompts: PromptVariation[]; }


export type VideoData = GeneratedYoutubeVideo;
export type InstagramData = GeneratedReelVisual;

export interface HistoryItem<TInputs, TData> { id: string; type: TabType; timestamp: number; inputs: TInputs; data: TData; title: string; pinned?: boolean; }
export interface PlanInputs { topic: string; niche: string; target_audience: string; content_goal: string; custom_cta: string }
export interface YoutubeInputs { selectedDay: string; planId?: string; planInputs?: PlanInputs; }
export interface InstagramInputs { selectedDay: string; planId?: string; planInputs?: PlanInputs; }
export interface TrendFusionInputs { niche: string, target_audience: string };
export interface PromptStudioInputs { base_idea: string; target_ai: string; modifiers: string[]; }
export interface ChannelAuditInputs { channel_url: string; }