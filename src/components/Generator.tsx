import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Type } from 'lucide-react';

export const Generator: React.FC = () => {
  const [text, setText] = useState('');

  const downloadQR = () => {
    const svg = document.getElementById('qr-gen');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'qrcode.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-8">
      <div className="w-full space-y-2">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <Type size={14} />
          Content to Encode
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter URL or text..."
          className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
        />
      </div>

      <div className="relative p-6 bg-white rounded-3xl shadow-2xl">
        {text ? (
          <QRCodeSVG
            id="qr-gen"
            value={text}
            size={200}
            level="H"
            includeMargin={false}
          />
        ) : (
          <div className="w-[200px] h-[200px] bg-zinc-100 rounded-lg flex items-center justify-center border-2 border-dashed border-zinc-300">
            <p className="text-zinc-400 text-xs text-center px-4">Enter text above to generate QR</p>
          </div>
        )}
      </div>

      {text && (
        <div className="flex gap-4 w-full">
          <button
            onClick={downloadQR}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-zinc-800"
          >
            <Download size={20} />
            Download
          </button>
          <button
            onClick={() => navigator.share?.({ title: 'QR Code', text: text })}
            className="bg-orange-600 hover:bg-orange-500 text-white p-4 rounded-2xl transition-all shadow-lg shadow-orange-900/20"
          >
            <Share2 size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
