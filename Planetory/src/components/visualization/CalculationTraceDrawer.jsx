import React, { useState } from 'react';
import { formatCalculationForCopy } from '../../science/calculations/calculationFormatter';

/**
 * CalculationTraceDrawer.jsx - Detailed Scientific Calculation Terminal UI
 * Renders inline step-by-step calculation trace with inputs, SI conversions,
 * substitution, result, reference check, assumptions, copy export, and basic/advanced views.
 */
export default function CalculationTraceDrawer({ 
  calc, 
  objName = 'Target Body', 
  viewMode = 'BASIC', // 'BASIC' | 'ADVANCED'
  onToggleViewMode
}) {
  const [copied, setCopied] = useState(false);

  if (!calc) return null;

  const handleCopy = () => {
    const text = formatCalculationForCopy(calc, objName);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isInvalid = calc.status !== 'VALID';

  return (
    <div className="calc-trace-drawer font-mono" tabIndex={0} aria-label={`Calculation trace for ${calc.name}`}>
      {/* ── HEADER & TOOLBAR ────────────────────────────────────────────── */}
      <div className="ctd-header">
        <div className="ctd-title-group">
          <div className="ctd-name">
            <span>{calc.name.toUpperCase()} ({calc.symbol})</span>
            <span className={`ctd-badge ${isInvalid ? 'ctd-badge--error' : 'ctd-badge--valid'}`}>
              {calc.validMatch || calc.status}
            </span>
            <span className="ctd-badge ctd-badge--model">{calc.model}</span>
          </div>
          {calc.tooltip && (
            <div className="ctd-tooltip font-mono">
              <span className="ctd-info-icon">ⓘ</span> {calc.tooltip}
            </div>
          )}
        </div>

        <div className="ctd-actions">
          {onToggleViewMode && (
            <button 
              className="ctd-btn"
              onClick={() => onToggleViewMode(viewMode === 'BASIC' ? 'ADVANCED' : 'BASIC')}
            >
              {viewMode === 'BASIC' ? 'ADVANCED MODE ⚙' : 'BASIC MODE ⚡'}
            </button>
          )}
          <button 
            className={`ctd-btn ${copied ? 'ctd-btn--copied' : ''}`}
            onClick={handleCopy}
            title="Copy clean calculation trace to clipboard"
          >
            {copied ? '✓ COPIED' : '📋 COPY'}
          </button>
        </div>
      </div>

      {/* ── INVALID INPUT / UNAVAILABLE STATE ───────────────────────────── */}
      {isInvalid ? (
        <div className="ctd-error-box font-mono">
          <span className="ctd-err-title">⚠ CALCULATION UNAVAILABLE</span>
          <span className="ctd-err-reason">{calc.statusReason || 'Required physical inputs are missing or invalid.'}</span>
        </div>
      ) : (
        <div className="ctd-body">
          {/* STEP 1: INPUT PARAMETERS */}
          <div className="ctd-step">
            <span className="ctd-step-lbl">1. INPUT PARAMETERS</span>
            <div className="ctd-inputs-table">
              {calc.inputs.map(inp => (
                <div key={inp.symbol} className="ctd-input-row">
                  <span className="inp-sym">{inp.symbol}</span>
                  <span className="inp-name">{inp.name}:</span>
                  <span className="inp-val">{inp.displayValue} {inp.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 2: UNIT CONVERSIONS (SI) */}
          {calc.unitConversions && calc.unitConversions.length > 0 && (
            <div className="ctd-step">
              <span className="ctd-step-lbl">2. SI UNIT CONVERSIONS</span>
              <div className="ctd-conversions">
                {calc.unitConversions.map((conv, i) => (
                  <div key={i} className="ctd-conv-row">➔ {conv}</div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: FORMULA & SUBSTITUTION */}
          <div className="ctd-step">
            <span className="ctd-step-lbl">3. FORMULA & NUMERICAL SUBSTITUTION</span>
            <div className="ctd-formula-box">
              <div className="ctd-form-line">
                <span className="ctd-form-tag">FORMULA:</span>
                <span className="ctd-form-val text-cyan">{calc.formula}</span>
              </div>
              <div className="ctd-sub-line">
                <span className="ctd-form-tag">SUBSTITUTION:</span>
                <span className="ctd-sub-val text-amber">{calc.substitution}</span>
              </div>
            </div>
          </div>

          {/* STEP 4: CALCULATED RESULT */}
          <div className="ctd-step ctd-step--result">
            <span className="ctd-step-lbl">4. CALCULATED RESULT</span>
            <div className="ctd-result-banner">
              <span className="crb-sym">{calc.symbol} =</span>
              <span className="crb-val">{calc.displayResult}</span>
              <span className="crb-unit">{calc.unit}</span>
            </div>
          </div>

          {/* STEP 5: REFERENCE CHECK & VALIDATION */}
          {calc.referenceValue !== null && calc.referenceValue !== undefined && (
            <div className="ctd-step ctd-step--ref">
              <span className="ctd-step-lbl">5. AUTHORITATIVE REFERENCE VALIDATION</span>
              <div className="ctd-ref-grid">
                <div className="ctd-ref-card">
                  <span className="crc-lbl">REFERENCE VALUE</span>
                  <span className="crc-val">{calc.referenceValue} {calc.unit}</span>
                </div>
                <div className="ctd-ref-card">
                  <span className="crc-lbl">DERIVED RESULT</span>
                  <span className="crc-val">{calc.displayResult} {calc.unit}</span>
                </div>
                <div className="ctd-ref-card">
                  <span className="crc-lbl">DIFFERENCE (Δ)</span>
                  <span className={`crc-val ${calc.referenceDiff < 1 ? 'text-green' : 'text-amber'}`}>
                    {calc.referenceDiff != null ? `${calc.referenceDiff.toFixed(3)}%` : '<0.01%'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ADVANCED MODE EXTRA DETAILS */}
          {viewMode === 'ADVANCED' && (
            <div className="ctd-advanced-section">
              <span className="ctd-step-lbl">6. METADATA & MODEL ASSUMPTIONS</span>
              <div className="ctd-meta-grid">
                <div><strong>Source:</strong> {calc.source}</div>
                <div><strong>Model Type:</strong> {calc.model}</div>
                <div><strong>Calculation Type:</strong> {calc.type}</div>
              </div>
              {calc.assumptions && calc.assumptions.length > 0 && (
                <div className="ctd-assumptions">
                  <span className="ca-title">ASSUMPTIONS:</span>
                  {calc.assumptions.map((a, idx) => (
                    <div key={idx} className="ca-item">• {a}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
