'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, X, MapPin } from 'lucide-react';

export interface DamagePin {
  id: string;
  x: number;
  y: number;
  note: string;
}

interface DamageDiagramProps {
  value: DamagePin[];
  onChange: (pins: DamagePin[]) => void;
  readOnly?: boolean;
}

export function DamageDiagram({ value, onChange, readOnly = false }: DamageDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePinId, setActivePinId] = useState<string | null>(null);

  // Focus input when a new pin is added
  useEffect(() => {
    if (activePinId) {
      const inputElement = document.getElementById(`pin-input-${activePinId}`);
      if (inputElement) inputElement.focus();
    }
  }, [activePinId]);

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    
    // Ignore clicks if clicking on an existing pin or input
    if ((e.target as HTMLElement).closest('.pin-element')) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPin: DamagePin = {
      id: Math.random().toString(36).substring(7),
      x,
      y,
      note: ''
    };

    onChange([...value, newPin]);
    setActivePinId(newPin.id);
  };

  const updatePinNote = (id: string, note: string) => {
    onChange(value.map(pin => pin.id === id ? { ...pin, note } : pin));
  };

  const removePin = (id: string) => {
    onChange(value.filter(pin => pin.id !== id));
  };

  return (
    <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" />
          Mapeamento de Avarias
        </h3>
        <p className="text-xs text-slate-500">
          {readOnly ? 'Avarias registradas na entrada do aparelho' : 'Clique no desenho abaixo para marcar onde estão os arranhões/trincados'}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Diagram Area */}
        <div 
          ref={containerRef}
          onClick={handleDiagramClick}
          className={`relative w-full max-w-[280px] mx-auto aspect-[1/2] bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl shadow-inner ${!readOnly ? 'cursor-crosshair hover:border-primary/50 transition-colors' : ''}`}
        >
          {/* Decorative Phone UI lines to look like a phone */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none">
            <Smartphone className="w-32 h-32" />
          </div>

          {/* Pins */}
          {value.map((pin) => (
            <div 
              key={pin.id} 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pin-element"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              <div 
                className={`relative group flex flex-col items-center justify-center w-6 h-6 rounded-full bg-danger text-white shadow-md shadow-danger/30 text-xs font-bold cursor-pointer ${activePinId === pin.id ? 'ring-4 ring-danger/20' : ''}`}
                onClick={() => !readOnly && setActivePinId(pin.id)}
              >
                <MapPin className="w-3 h-3" />
                
                {/* Tooltip for ReadOnly mode */}
                {readOnly && pin.note && (
                  <div className="absolute top-full mt-1 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    {pin.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend / Inputs Area */}
        <div className="flex-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 min-h-[150px]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Legenda de Avarias</h4>
            
            {value.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6 italic">
                Nenhuma avaria marcada.
              </div>
            ) : (
              <ul className="space-y-2">
                {value.map((pin, index) => (
                  <li key={pin.id} className="flex items-start gap-2 pin-element">
                    <div className="w-5 h-5 mt-0.5 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0 font-bold text-xs">
                      {index + 1}
                    </div>
                    {readOnly ? (
                      <div className="flex-1 text-sm pt-0.5 text-slate-700 dark:text-slate-300">
                        {pin.note || 'Sem descrição'}
                      </div>
                    ) : (
                      <div className="flex-1 flex gap-2">
                        <input
                          id={`pin-input-${pin.id}`}
                          type="text"
                          value={pin.note}
                          onChange={(e) => updatePinNote(pin.id, e.target.value)}
                          placeholder="Descreva o defeito (ex: Trincado profundo)"
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm px-2 py-1 outline-none focus:border-primary"
                        />
                        <button 
                          onClick={() => removePin(pin.id)}
                          className="p-1 text-slate-400 hover:text-danger transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
