import React, { useState, useEffect, useMemo } from 'react';
import { 
  getAllCalculationsForObject, 
  filterCalculations, 
  CALCULATION_CATEGORIES 
} from '../../science/calculations/calculationRegistry';
import CalculationTraceDrawer from './CalculationTraceDrawer';

/**
 * ScientificCalculationExplorer.jsx - PART 24.5 Visible Scientific Calculation Interface
 * Renders the visible Scientific Calculations list & step-by-step calculation trace explorer
 * directly inside the Planet Information Panel for all selected objects.
 */
export default function ScientificCalculationExplorer({ obj, defaultExpandedId = null }) {
  const [expandedCalcId, setExpandedCalcId] = useState(defaultExpandedId);
  const [calcCategory, setCalcCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [humanMassKg, setHumanMassKg] = useState(70);
  const [viewMode, setViewMode] = useState('BASIC');

  // Reset expanded calculation when selected object changes
  useEffect(() => {
    setExpandedCalcId(null);
  }, [obj?.id, obj?.spkid]);

  // Handle global Escape key to close expanded calculation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        if (expandedCalcId) {
          e.stopPropagation();
          setExpandedCalcId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [expandedCalcId]);

  // Centralized calculation evaluation for selected object
  const allCalculations = useMemo(() => {
    if (!obj) return [];
    return getAllCalculationsForObject(obj, { humanMassKg });
  }, [obj, humanMassKg]);

  const filteredCalculations = useMemo(() => {
    return filterCalculations(allCalculations, { category: calcCategory, search: searchQuery });
  }, [allCalculations, calcCategory, searchQuery]);

  const activeCalcObj = useMemo(() => {
    if (!expandedCalcId) return null;
    return allCalculations.find(c => c.id === expandedCalcId) || null;
  }, [allCalculations, expandedCalcId]);

  if (!obj) return null;

  const handleToggleCalc = (calcId, e) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedCalcId(prev => prev === calcId ? null : calcId);
  };

  return (
    <div 
      className="scientific-calculation-explorer sci-panel-v7 font-mono"
      onPointerDown={(e) => e.stopPropagation()} // Prevent panel drag on click
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── SECTION HEADER ──────────────────────────────────────────────── */}
      <div className="sce-header">
        <div className="sce-header-title font-mono">
          <span className="sce-icon">📐</span>
          <span className="sce-title">SCIENTIFIC CALCULATIONS</span>
          <span className="sce-badge">{allCalculations.length} FORMULAS AVAILABLE</span>
        </div>
        <div className="sce-subtitle font-mono">
          Derived physical parameters, mathematical formulas & step-by-step traces
        </div>
      </div>

      {/* ── TOOLBAR (CATEGORIES & SEARCH) ────────────────────────────────── */}
      <div className="sce-toolbar font-mono">
        <div className="sce-categories">
          {CALCULATION_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`sce-cat-btn ${calcCategory === cat.id ? 'sce-cat-btn--active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setCalcCategory(cat.id); }}
            >
              {cat.name.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="sce-search-row">
          <input
            type="text"
            className="sce-search-input font-mono"
            placeholder="🔍 Search formulas (e.g., gravity, escape, volume, density)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          {searchQuery && (
            <button 
              className="sce-clear-btn" 
              onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── VISIBLE CALCULATION ROWS LIST ────────────────────────────────── */}
      <div className="sce-list">
        {filteredCalculations.length === 0 ? (
          <div className="sce-empty font-mono">No matching calculations for "{searchQuery}"</div>
        ) : (
          filteredCalculations.map(calc => {
            const isExpanded = expandedCalcId === calc.id;
            return (
              <div key={calc.id} className="sce-row-wrapper">
                <div 
                  className={`sce-row ${isExpanded ? 'sce-row--active' : ''}`}
                  onClick={(e) => handleToggleCalc(calc.id, e)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleCalc(calc.id, e);
                    }
                  }}
                >
                  <div className="sce-row-left">
                    <span className="sce-row-name">{calc.name}</span>
                    <span className="sce-row-symbol">({calc.symbol})</span>
                    <span className="sce-row-formula font-mono">{calc.formula}</span>
                  </div>

                  <div className="sce-row-right">
                    <span className="sce-row-res text-cyan">{calc.displayResult} {calc.unit}</span>
                    <button 
                      className={`sce-fx-btn ${isExpanded ? 'sce-fx-btn--active' : ''}`}
                      onClick={(e) => handleToggleCalc(calc.id, e)}
                    >
                      {isExpanded ? 'HIDE [×]' : 'ƒx [VIEW]'}
                    </button>
                  </div>
                </div>

                {/* INLINE STEP-BY-STEP CALCULATION TRACE DRAWER */}
                {isExpanded && activeCalcObj && activeCalcObj.id === calc.id && (
                  <div className="sce-drawer-container">
                    <CalculationTraceDrawer
                      calc={activeCalcObj}
                      objName={obj.name}
                      viewMode={viewMode}
                      onToggleViewMode={setViewMode}
                    />
                    <div className="sce-drawer-footer">
                      <button 
                        className="sce-close-drawer-btn font-mono"
                        onClick={(e) => { e.stopPropagation(); setExpandedCalcId(null); }}
                      >
                        ▲ HIDE CALCULATION TRACE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── HUMAN WEIGHT ADJUSTMENT SLIDER FOR EFFECTIVE WEIGHT ──────────── */}
      {expandedCalcId === 'human-weight' && (
        <div className="sce-weight-slider-box font-mono">
          <span className="sws-lbl">REFERENCE HUMAN BODY MASS:</span>
          <input 
            type="range"
            min="1"
            max="200"
            value={humanMassKg}
            onChange={(e) => setHumanMassKg(Number(e.target.value))}
            className="sws-slider"
          />
          <span className="sws-val">{humanMassKg} kg</span>
        </div>
      )}
    </div>
  );
}
