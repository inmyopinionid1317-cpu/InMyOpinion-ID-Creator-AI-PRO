/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { PerformanceMetrics } from './types';

// --- ICONS ---
export const CopyIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>);
export const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>);
export const DownloadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);
export const PlanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
export const YoutubeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10C2.5 4.64 4.64 2.5 7 2.5h10c2.36 0 4.5 2.14 4.5 4.5a24.12 24.12 0 0 1 0 10c0 2.36-2.14 4.5-4.5 4.5H7c-2.36 0-4.5-2.14-4.5-4.5z"></path><polygon points="9.5 14.5 15.5 12 9.5 9.5 9.5 14.5"></polygon></svg>;
export const ReelsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
export const MoreVerticalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>;
export const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
export const PinIcon = ({isPinned}: {isPinned: boolean}) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
export const WordIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 13 8 9"></polyline></svg>;
export const PdfIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 11.5v-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"></path><path d="M13 11.5v-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"></path><path d="M8.5 16.5a.5.5 0 0 1-1 0V14h-1v2.5a.5.5 0 0 1-1 0V14a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2.5a.5.5 0 0 1-1 0V14h-1v2.5z"></path></svg>;
export const SpeakerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>;
export const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg>;
export const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
export const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>;
export const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
export const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>;
export const RestartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/></svg>;
export const DownloadVideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3m0 12l-4-4m4 4l4-4"/><path d="M2 17a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2H2v2z"/></svg>;
export const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
export const TrendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
export const MultiplyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18M5.636 5.636l12.728 12.728M18.364 5.636L5.636 18.364"/></svg>;
export const AnalyzerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8a2.5 2.5 0 0 1-2.2 2.2"/><path d="M13.3 12.8a2.5 2.5 0 0 1-2.2 2.2"/><path d="M8 18a2.5 2.5 0 0 1-2.2-2.2"/></svg>;
export const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8a2.5 2.5 0 0 1-2.2 2.2"/><path d="M13.3 12.8a2.5 2.5 0 0 1-2.2 2.2"/><path d="M8 18a2.5 2.5 0 0 1-2.2-2.2"/></svg>;
export const LineChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
export const BookOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
export const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5z"/></svg>;
export const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
export const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
export const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
export const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
export const BrainCircuitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 0-3.38 19.43M12 2a10 10 0 0 1 3.38 19.43"/><path d="M12 2a10 10 0 0 0-7.32 10H12h7.32A10 10 0 0 0 12 2Z"/><path d="M12 22a10 10 0 0 1-7.32-10H12h7.32A10 10 0 0 1 12 22Z"/><path d="M12 12v10"/><path d="M12 12V2"/><path d="m15.38 19.43-3.38-7.43-3.38 7.43"/><path d="m8.62 4.57 3.38 7.43 3.38-7.43"/><path d="M4.68 12h14.64"/></svg>;
export const UploadCloudIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>;
export const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;


// --- UI COMPONENTS ---
export const ActionButtons = ({ children }: { children: React.ReactNode }) => <div className="action-buttons">{children}</div>;

export const CopyButton = ({ textToCopy, label }: { textToCopy: string; label: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => { navigator.clipboard.writeText(textToCopy); setCopied(true); };
    useEffect(() => { if (copied) { const timer = setTimeout(() => setCopied(false), 2000); return () => clearTimeout(timer); } }, [copied]);
    return <button onClick={handleCopy} className={`copy-button ${copied ? 'copied' : ''}`} aria-label={label}>{copied ? <CheckIcon /> : <CopyIcon />}{copied ? 'Copied!' : label}</button>;
};

export const DownloadButton = ({ imageUrl, filename }: { imageUrl: string; filename: string }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const handleDownload = async () => { if (isDownloading) return; setIsDownloading(true); try { const response = await fetch(imageUrl); const blob = await response.blob(); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url); } catch (error) { console.error("Failed to download image:", error); alert("Failed to download image."); } finally { setIsDownloading(false); } };
    return <button onClick={handleDownload} className="download-button" disabled={isDownloading}><DownloadIcon />{isDownloading ? 'Downloading...' : 'Download'}</button>;
};

export const LoadingSpinner = () => <div className="loading-spinner"></div>;

export const ErrorMessage = ({ message }: { message: string }) => <div className="error-message">{message}</div>;

export const BackgroundBubbles = () => <ul className="background-bubbles">{Array.from({ length: 10 }).map((_, i) => <li key={i}></li>)}</ul>;

export const PromptStudioPlaceholder = () => (
    <div className="prompt-studio-placeholder">
        <p>Hasil prompt yang dioptimalkan akan muncul di sini.</p>
        <svg className="prompt-studio-animation" viewBox="0 0 250 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="125" cy="100" r="100" className="bg-pulse" />
            <g className="character-group">
                {/* Body */}
                <path d="M 85,190 C 85,160 165,160 165,190 Z" fill="#303134" stroke="#444" strokeWidth="2"/>
                {/* Head */}
                <g className="head">
                    <circle cx="125" cy="125" r="40" fill="#2a2a2a" stroke="#444" strokeWidth="2"/>
                    <path d="M 105 122 C 108 118, 112 118, 115 122" stroke="#e0e0e0" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    <path d="M 135 122 C 138 118, 142 118, 145 122" stroke="#e0e0e0" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    <circle cx="100" cy="135" r="5" fill="var(--primary)" opacity="0.3"/>
                    <circle cx="150" cy="135" r="5" fill="var(--primary)" opacity="0.3"/>
                    {/* Antenna */}
                    <line x1="125" y1="85" x2="125" y2="70" stroke="#444" strokeWidth="2" />
                    <circle cx="125" cy="65" r="4" fill="#2a2a2a" stroke="#444" strokeWidth="2"/>
                </g>
            </g>
        </svg>
    </div>
);

export const CollapsibleText = ({ text, maxLength = 200 }: { text: string, maxLength?: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (text.length <= maxLength) return <div className="caption-block"><p>{text}</p></div>;
    return (
        <div className="caption-block">
            <p>
                {isExpanded ? text : `${text.substring(0, maxLength)}... `}
                <button onClick={() => setIsExpanded(!isExpanded)} className="collapsible-text-toggle">
                    {isExpanded ? 'Less' : 'More'}
                </button>
            </p>
        </div>
    );
};

export const VoiceOverPlayer = ({ textToSpeak }: { textToSpeak: string }) => {
    const [generationState, setGenerationState] = useState<'idle' | 'generating' | 'ready'>('idle');
    const [isPlaying, setIsPlaying] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Load voices
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) setVoices(availableVoices);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);
    
    // Reset component state if the text changes
    useEffect(() => {
        window.speechSynthesis.cancel();
        setGenerationState('idle');
        setIsPlaying(false);
    }, [textToSpeak]);

    // Cleanup on unmount
    useEffect(() => () => window.speechSynthesis.cancel(), []);

    const handleGenerate = () => {
        if (!textToSpeak || voices.length === 0 && !window.speechSynthesis.getVoices().length) return;
        setGenerationState('generating');
        // Simulate AI generation time
        setTimeout(() => setGenerationState('ready'), 2000);
    };

    const handleTogglePlay = () => {
        const synth = window.speechSynthesis;
        if (isPlaying) {
            synth.cancel();
            setIsPlaying(false);
            return;
        }

        if (synth.speaking) synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utteranceRef.current = utterance;
        
        const indonesianVoice = voices.find(v => v.lang === 'id-ID') || voices.find(v => v.lang.startsWith('id'));
        if (indonesianVoice) utterance.voice = indonesianVoice;
        
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        
        synth.speak(utterance);
    };

    const handleReset = () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setGenerationState('idle');
    };
    
    return (
        <div className="voice-over-player">
            {generationState === 'idle' && (
                <button onClick={handleGenerate} className="pro-voice-generate">
                    <SparklesIcon /> Hasilkan Audio Pro
                </button>
            )}
            {generationState === 'generating' && (
                <button className="pro-voice-generate" disabled>
                    <LoadingSpinner /> Menghasilkan...
                </button>
            )}
            {generationState === 'ready' && (
                <div className="pro-voice-controls">
                    <button onClick={handleTogglePlay} className="pro-voice-play">
                        {isPlaying ? <StopIcon /> : <SpeakerIcon />}
                        {isPlaying ? 'Hentikan' : 'Putar Audio'}
                    </button>
                    <button onClick={handleReset} className="pro-voice-reset" aria-label="Reset">
                        <RestartIcon />
                    </button>
                </div>
            )}
        </div>
    );
};

export const GuideModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [step, setStep] = useState(0);

    const guideSteps = [
        {
            icon: <PlanIcon />,
            title: "Langkah 1: Mulai dari Rencana",
            description: "Semuanya berawal dari sebuah rencana yang solid. Buka tab 'Content Plan', isi topik, niche, dan target audiens Anda. AI akan menyusun rencana konten 30 hari sebagai fondasi strategi Anda."
        },
         {
            icon: <SparklesIcon />,
            title: "Langkah 2: Ciptakan Prompt Sempurna",
            description: "Gunakan 'Prompt Studio' untuk mengubah ide sederhana menjadi prompt yang dioptimalkan untuk berbagai AI (Midjourney, DALL-E, dll.). Ini adalah rahasia untuk visual yang menakjubkan."
        },
        {
            icon: <><YoutubeIcon /><ReelsIcon /></>,
            title: "Langkah 3: Buat Aset Konten",
            description: "Setelah punya rencana, eksekusi! Buka tab 'Short Youtube' atau 'Instagram Reels'. Pilih hari dari rencana Anda, dan AI akan otomatis membuatkan skrip video yang menarik dan siap produksi."
        },
        {
            icon: <TrendIcon />,
            title: "Langkah 4: Cari Ide Baru & Viral",
            description: "Kehabisan ide? Gunakan 'Trend Fusion'. AI akan menganalisis tren yang sedang viral dan menggabungkannya dengan niche Anda untuk menghasilkan ide-ide segar yang berpotensi FYP."
        },
        {
            icon: <MultiplyIcon />,
            title: "Langkah 5: Lipatgandakan Konten Anda",
            description: "Jangan biarkan konten bagus hanya ada di satu platform. Gunakan tombol 'Multiply' pada item di histori untuk mengubah satu skrip video menjadi carousel Instagram, thread Twitter, atau artikel blog secara instan."
        },
        {
            icon: <AnalyzerIcon />,
            title: "Langkah 6: Analisis & Optimalisasi",
            description: "Setelah konten diunggah, masukkan metrik performanya di tab 'Analyzer'. Lalu, klik tombol analisis untuk mendapatkan wawasan cerdas tentang apa yang berhasil dan rekomendasi untuk konten selanjutnya."
        }
    ];

    useEffect(() => {
        if (isOpen) {
            setStep(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const currentStep = guideSteps[step];

    return (
        <div className={`modal-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose}>
            <div className="modal-content guide-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Panduan Cepat Creator AI</h2>
                    <button onClick={onClose} className="modal-close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="guide-step-content">
                        <div className="guide-step-icon">{currentStep.icon}</div>
                        <h3>{currentStep.title}</h3>
                        <p>{currentStep.description}</p>
                    </div>
                </div>
                <div className="modal-footer guide-navigation">
                    <div className="guide-progress">Langkah {step + 1} dari {guideSteps.length}</div>
                    <div className="guide-buttons">
                        <button onClick={() => setStep(s => s - 1)} className="button-secondary" disabled={step === 0}>Sebelumnya</button>
                        {step < guideSteps.length - 1 ? (
                            <button onClick={() => setStep(s => s + 1)} className="button-primary">Selanjutnya</button>
                        ) : (
                            <button onClick={onClose} className="button-primary">Selesai</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}) => {
    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose}>
            <div className="modal-content confirmation-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="modal-close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="button-secondary">
                        Batal
                    </button>
                    <button type="button" onClick={onConfirm} className="button-primary button-danger">
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
    );
};