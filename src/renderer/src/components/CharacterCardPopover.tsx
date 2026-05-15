import React from 'react'
import type { Character } from '../../../main/services/types'

interface Props {
  character: Character
  emotion?: string
  position: { x: number; y: number }
  onClose: () => void
}

export default function CharacterCardPopover({ character, emotion, position, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute bg-game-panel rounded-2xl border border-game-accent/30 p-5 shadow-2xl w-72 backdrop-blur-md"
        style={{ left: Math.min(position.x, window.innerWidth - 300), top: Math.min(position.y, window.innerHeight - 350) }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-3 right-3 text-game-muted hover:text-game-text text-lg">&times;</button>

        {/* Avatar / Image */}
        <div className="flex justify-center mb-4">
          {character.imagePath ? (
            <img src={`file://${character.imagePath}`} alt={character.name}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-game-highlight/30 shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-game-highlight/30 to-violet-600/30 flex items-center justify-center text-3xl font-bold text-game-highlight shadow-lg">
              {character.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Name + badges */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-game-text">{character.name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            {character.isPlayer && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-game-highlight/20 text-game-highlight">Player</span>
            )}
            {emotion && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-game-muted">{emotion}</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-game-muted">Gender</span>
            <span className="text-game-text">{character.gender || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-game-muted">Age</span>
            <span className="text-game-text">{character.age || '-'}</span>
          </div>
          {character.appearance && (
            <div>
              <span className="text-game-muted text-xs">Appearance</span>
              <p className="text-game-text mt-0.5 leading-relaxed">{character.appearance}</p>
            </div>
          )}
          {character.personality && (
            <div>
              <span className="text-game-muted text-xs">Personality</span>
              <p className="text-game-text mt-0.5 leading-relaxed">{character.personality}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}