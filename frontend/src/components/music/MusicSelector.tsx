'use client';
import { useState, useEffect } from 'react';
import { Music, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { musicService, BackgroundMusic } from '@/services/music.service';
import { cn } from '@/lib/utils';

interface MusicSelectorProps {
  selectedMusic: BackgroundMusic | null;
  onSelect: (music: BackgroundMusic | null) => void;
}

export function MusicSelector({ selectedMusic, onSelect }: MusicSelectorProps) {
  const [musicList, setMusicList] = useState<BackgroundMusic[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    loadMusic();
  }, []);

  const loadMusic = async () => {
    try {
      const music = await musicService.getAllMusic();
      setMusicList(music);
    } catch (error) {
      console.error('Failed to load music:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (music: BackgroundMusic) => {
    if (playingId === music.id) {
      setPlayingId(null);
    } else {
      setPlayingId(music.id);
    }
  };

  const handleSelect = (music: BackgroundMusic) => {
    if (selectedMusic?.id === music.id) {
      onSelect(null);
      setPlayingId(null);
    } else {
      onSelect(music);
      setPlayingId(music.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kili-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-text-muted font-body">
          Chagua Muziki wa Msingi (Background Music)
        </label>
        <button
          onClick={() => setMuted(!muted)}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {musicList.length === 0 ? (
        <div className="text-center py-6 text-text-muted text-sm font-body">
          Hakuna muziki uliopo
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {musicList.map((music) => (
            <div
              key={music.id}
              onClick={() => handleSelect(music)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
                selectedMusic?.id === music.id
                  ? 'bg-kili-gold/10 border border-kili-gold/30'
                  : 'bg-dark-elevated border border-dark-border hover:border-kili-gold/30'
              )}
            >
              {/* Play button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay(music);
                }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                  playingId === music.id
                    ? 'bg-kili-gold text-dark-bg'
                    : 'bg-dark-elevated text-kili-gold'
                )}
              >
                {playingId === music.id ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} className="ml-0.5" />
                )}
              </button>

              {/* Music info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary font-body truncate">
                  {music.title}
                </p>
                {music.description && (
                  <p className="text-xs text-text-muted font-body truncate">
                    {music.description}
                  </p>
                )}
              </div>

              {/* Selected indicator */}
              {selectedMusic?.id === music.id && (
                <div className="w-5 h-5 rounded-full bg-kili-gold flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-dark-bg" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Audio element for preview */}
      {playingId && (
        <audio
          src={musicList.find((m) => m.id === playingId)?.file}
          autoPlay
          loop
          muted={muted}
          onEnded={() => setPlayingId(null)}
          className="hidden"
        />
      )}
    </div>
  );
}
