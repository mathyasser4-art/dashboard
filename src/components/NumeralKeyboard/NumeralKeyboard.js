import React from 'react';
import './NumeralKeyboard.css'

const ENGLISH_NUMERALS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

const NumeralKeyboard = ({ onInsert, onBackspace, onSpace, onClose }) => {
    return (
        <div className="numeral-keyboard">
            <div className="numeral-keyboard__header">
                <p>Numeral keyboard</p>
                <button type="button" onClick={onClose}>Close</button>
            </div>

            <div className="numeral-keyboard__section">
                <span>English numerals</span>
                <div className="numeral-keyboard__grid">
                    {ENGLISH_NUMERALS.map(item => (
                        <button type="button" key={`en-${item}`} onClick={() => onInsert(item)}>
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            <div className="numeral-keyboard__section">
                <span>Arabic numerals</span>
                <div className="numeral-keyboard__grid">
                    {ARABIC_NUMERALS.map(item => (
                        <button type="button" key={`ar-${item}`} onClick={() => onInsert(item)}>
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            <div className="numeral-keyboard__actions">
                <button type="button" onClick={onSpace}>Space</button>
                <button type="button" onClick={onBackspace}>Backspace</button>
            </div>
        </div>
    );
}

export default NumeralKeyboard;
