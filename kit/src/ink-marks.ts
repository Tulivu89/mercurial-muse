// The marks' drawings (docs/brand.md › Marks), defined once per page and drawn with <use>.
// Their colours are the --mk-* tokens in wet-ink.css, so day and night are a token change.
// Inkwyrm, Studio and Chat are the owner's drawings; the Adventure dragon too, with lacquer added.
// Edit the masters in docs/brand/marks/, then this.
export const INK_MARK_DEFS = `<defs>
<radialGradient id="mkInk" cx="38%" cy="28%" r="68%">
<stop offset="0%" style="stop-color: var(--mk-0)"/>
<stop offset="28%" style="stop-color: var(--mk-1)"/>
<stop offset="65%" style="stop-color: var(--mk-2)"/>
<stop offset="100%" style="stop-color: var(--mk-3)"/>
</radialGradient>
<radialGradient id="mkInkDragon" gradientUnits="userSpaceOnUse" cx="200" cy="170" r="360">
<stop offset="0%" style="stop-color: var(--mk-0)"/>
<stop offset="28%" style="stop-color: var(--mk-1)"/>
<stop offset="65%" style="stop-color: var(--mk-2)"/>
<stop offset="100%" style="stop-color: var(--mk-3)"/>
</radialGradient>
<linearGradient id="mkSoft" x1="0%" y1="0%" x2="60%" y2="100%">
<stop offset="0%" style="stop-color: var(--mk-shine)" stop-opacity="0.5"/>
<stop offset="40%" style="stop-color: var(--mk-shine)" stop-opacity="0.2"/>
<stop offset="100%" style="stop-color: var(--mk-shine)" stop-opacity="0"/>
</linearGradient>
<linearGradient id="mkSharp" x1="0%" y1="0%" x2="50%" y2="100%">
<stop offset="0%" style="stop-color: var(--mk-shine)" stop-opacity="0.95"/>
<stop offset="30%" style="stop-color: var(--mk-shine)" stop-opacity="0.6"/>
<stop offset="100%" style="stop-color: var(--mk-shine)" stop-opacity="0"/>
</linearGradient>
<linearGradient id="mkRibbon" x1="0%" y1="0%" x2="60%" y2="100%">
<stop offset="0%" style="stop-color: var(--mk-shine)" stop-opacity="0.95"/>
<stop offset="50%" style="stop-color: var(--mk-shine)" stop-opacity="0.75"/>
<stop offset="100%" style="stop-color: var(--mk-shine)" stop-opacity="0.35"/>
</linearGradient>
<linearGradient id="mkPill" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" style="stop-color: var(--mk-shine)" stop-opacity="0.8"/>
<stop offset="100%" style="stop-color: var(--mk-shine)" stop-opacity="0.4"/>
</linearGradient>
<linearGradient id="mkCounter" x1="50%" y1="0%" x2="0%" y2="100%">
<stop offset="0%" style="stop-color: var(--mk-shine)" stop-opacity="0.45"/>
<stop offset="60%" style="stop-color: var(--mk-shine)" stop-opacity="0.25"/>
<stop offset="100%" style="stop-color: var(--mk-shine)" stop-opacity="0.05"/>
</linearGradient>
<radialGradient id="mkDome" cx="42%" cy="32%" r="50%">
<stop offset="0%" style="stop-color: var(--mk-shine)" stop-opacity="0.18"/>
<stop offset="55%" style="stop-color: var(--mk-shine)" stop-opacity="0.06"/>
<stop offset="100%" style="stop-color: var(--mk-shine)" stop-opacity="0"/>
</radialGradient>
<clipPath id="mkMainClip"><path d="M250 28 C244 80 100 210 100 320 A150 150 0 0 0 400 320 C400 210 256 80 250 28 Z"/></clipPath>
<mask id="mkMainMask" maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="500">
<rect width="500" height="500" fill="#fff"/>
<g stroke="#000" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none">
<path d="M223 280 L250 253 L277 280"/><path d="M223 370 L250 397 L277 370"/>
<path d="M205 280 H178 V307"/><path d="M295 280 H322 V307"/><path d="M205 370 H178 V343"/><path d="M295 370 H322 V343"/>
</g>
<path d="M190 325 C214 290 286 290 310 325 C286 360 214 360 190 325 Z" fill="#000"/>
<path d="M250 301 C259 313 260.5 337 250 349 C239.5 337 241 313 250 301 Z" fill="#fff"/>
</mask>
<symbol id="mk-main" viewBox="0 0 500 500">
<ellipse cx="250" cy="476" rx="105" ry="14" style="fill: var(--mk-shadow); opacity: calc(var(--mk-shadow-a) * var(--mk-gleam))"/>
<g style="opacity: var(--mk-cut-a)">
<g style="stroke: var(--mk-cut)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none">
<path d="M223 280 L250 253 L277 280"/><path d="M223 370 L250 397 L277 370"/>
<path d="M205 280 H178 V307"/><path d="M295 280 H322 V307"/><path d="M205 370 H178 V343"/><path d="M295 370 H322 V343"/>
</g>
<path d="M190 325 C214 290 286 290 310 325 C286 360 214 360 190 325 Z" style="fill: var(--mk-cut)"/>
</g>
<g mask="url(#mkMainMask)">
<path d="M250 28 C244 80 100 210 100 320 A150 150 0 0 0 400 320 C400 210 256 80 250 28 Z" fill="url(#mkInk)" style="stroke: var(--mk-rim); stroke-opacity: var(--mk-rim-a); stroke-width: 6"/>
<g clip-path="url(#mkMainClip)" style="opacity: calc(var(--mk-shine-a) * var(--mk-gleam))">
<path d="M374 265 A142 142 0 0 1 285 456" fill="none" style="stroke: var(--mk-shine)" stroke-width="5" stroke-linecap="round" opacity="0.25"/>
<path d="M238 82 C190 150 120 226 120 324 C120 330 108 330 108 322 C108 216 182 138 230 76 C234 71 240 76 238 82 Z" fill="url(#mkSoft)"/>
<path d="M232 90 C188 156 128 228 128 318 C128 323 120 323 120 316 C120 220 182 146 226 84 C229 80 234 84 232 90 Z" fill="url(#mkSharp)"/>
<ellipse cx="224" cy="116" rx="4" ry="9" transform="rotate(-28 224 116)" style="fill: var(--mk-shine)" opacity="0.9"/>
</g>
</g>
</symbol>
<clipPath id="mkNibClip"><path d="M250 20 C234 20 222 32 222 48 C222 62 228 70 234 76 C232 82 228 88 224 96 C200 145 100 225 100 320 A150 150 0 0 0 400 320 C400 225 300 145 276 96 C272 88 268 82 266 76 C272 70 278 62 278 48 C278 32 266 20 250 20 Z"/></clipPath>
<mask id="mkNibMask" maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="500">
<rect width="500" height="500" fill="#fff"/>
<line x1="250" y1="10" x2="250" y2="305" stroke="#000" stroke-width="11"/>
<path d="M190 325 C214 290 286 290 310 325 C286 360 214 360 190 325 Z" fill="#000"/>
<path d="M250 301 C259 313 260.5 337 250 349 C239.5 337 241 313 250 301 Z" fill="#fff"/>
</mask>
<symbol id="mk-nib" viewBox="0 0 500 500">
<ellipse cx="250" cy="476" rx="105" ry="14" style="fill: var(--mk-shadow); opacity: calc(var(--mk-shadow-a) * var(--mk-gleam))"/>
<g style="opacity: var(--mk-cut-a)">
<line x1="250" y1="96" x2="250" y2="305" style="stroke: var(--mk-cut)" stroke-width="11"/>
<path d="M190 325 C214 290 286 290 310 325 C286 360 214 360 190 325 Z" style="fill: var(--mk-cut)"/>
</g>
<g mask="url(#mkNibMask)">
<path d="M250 20 C234 20 222 32 222 48 C222 62 228 70 234 76 C232 82 228 88 224 96 C200 145 100 225 100 320 A150 150 0 0 0 400 320 C400 225 300 145 276 96 C272 88 268 82 266 76 C272 70 278 62 278 48 C278 32 266 20 250 20 Z" fill="url(#mkInk)" style="stroke: var(--mk-rim); stroke-opacity: var(--mk-rim-a); stroke-width: 6"/>
<g clip-path="url(#mkNibClip)" style="opacity: calc(var(--mk-shine-a) * var(--mk-gleam))">
<path d="M374 265 A142 142 0 0 1 285 456" fill="none" style="stroke: var(--mk-shine)" stroke-width="5" stroke-linecap="round" opacity="0.25"/>
<path d="M234 98 C190 155 120 228 120 324 C120 330 108 330 108 322 C108 216 182 140 226 92 C230 87 236 92 234 98 Z" fill="url(#mkSoft)"/>
<path d="M228 106 C188 160 128 230 128 318 C128 323 120 323 120 316 C120 220 182 148 222 100 C225 96 230 100 228 106 Z" fill="url(#mkSharp)"/>
<ellipse cx="222" cy="122" rx="4" ry="9" transform="rotate(-28 222 122)" style="fill: var(--mk-shine)" opacity="0.9"/>
</g>
</g>
</symbol>
<clipPath id="mkBubbleClip"><path d="M240 68 C152 68 80 140 80 228 C80 316 152 388 240 388 C256 388 274 384 290 376 C320 386 352 402 388 418 C374 384 366 352 370 322 C373 300 398 268 398 228 C398 140 328 68 240 68 Z"/></clipPath>
<symbol id="mk-bubble" viewBox="0 0 500 500">
<ellipse cx="235" cy="465" rx="100" ry="12" style="fill: var(--mk-shadow); opacity: calc(var(--mk-shadow-a) * var(--mk-gleam) * 0.9)"/>
<path d="M240 68 C152 68 80 140 80 228 C80 316 152 388 240 388 C256 388 274 384 290 376 C320 386 352 402 388 418 C374 384 366 352 370 322 C373 300 398 268 398 228 C398 140 328 68 240 68 Z" fill="url(#mkInk)" style="stroke: var(--mk-rim); stroke-opacity: var(--mk-rim-a); stroke-width: 6"/>
<g clip-path="url(#mkBubbleClip)" style="opacity: calc(var(--mk-shine-a) * var(--mk-gleam))">
<circle cx="230" cy="210" r="140" fill="url(#mkDome)"/>
<path d="M372 175 C388 210 386 260 366 312 C356 338 354 368 372 396" fill="none" stroke="url(#mkCounter)" stroke-width="9" stroke-linecap="round"/>
<path d="M125 310 A140 140 0 0 0 220 378" fill="none" style="stroke: var(--mk-shine)" stroke-width="3" stroke-linecap="round" opacity="0.12"/>
<path d="M160 144 C185 118 218 104 252 104" fill="none" stroke="url(#mkRibbon)" stroke-width="15" stroke-linecap="round"/>
<path d="M276 108 C285 112 294 118 302 125" fill="none" stroke="url(#mkPill)" stroke-width="12" stroke-linecap="round"/>
<path d="M134 175 C128 186 124 198 122 210" fill="none" stroke="url(#mkPill)" stroke-width="12" stroke-linecap="round"/>
</g>
</symbol>
<clipPath id="mkDragonClip"><g transform="translate(250 250) scale(1.243) matrix(0.99997 -0.0075 0.0075 0.99997 0 0) translate(2.2 -1.6)"><path clip-rule="evenodd" d="M-10.08 -91.03 C-9.23 -87.35 -6.74 -79.58 -4.1 -77.91 C-2.18 -81.85 -1.29 -89.83 2.6 -91.22 C4.21 -92.75 16.04 -78.59 22.38 -77.36 C20.8 -10.16 -3.65 37.37 -41.09 45.75 C-59.35 52.72 -62.91 65.19 -63.03 81.72 C-63.31 103.14 -53.3 119.59 -27.73 129.53 C-31.08 129.67 -38.57 128.44 -39.67 128.48 C-17.51 144.13 20 150.92 47.16 130.67 C63.38 116.58 82.17 90.63 78.07 65.8 C76.2 55.29 68.52 40.93 57.59 37.14 C40.42 31.45 19.95 38.15 7.72 61.08 C41.3 93.66 8.23 137.29 -10.18 122.16 C2.85 121.16 6 113.97 3.39 105.41 C-3.67 93.03 -17.09 102.03 -26.83 86.78 C-32.97 72.93 -30.01 55.08 -7.02 55.81 C-2.71 39.58 15.95 17.54 37.56 13.34 C52.04 10.92 67.3 12.69 79.33 20.71 C92.12 20.2 111.63 41.29 111.63 41.77 C110.46 41.33 101.83 35.71 98.64 35.8 C100.13 37.25 105.79 43.95 107.89 46.47 C112.77 52.34 113.6 60.32 114.08 67.75 C113.54 67.48 109.51 59.27 108.82 58.27 C108.89 60.35 113.7 84.02 111.63 93.07 C109.72 90.19 109.3 88.8 106.33 88.76 C101.79 97.89 93.26 118.96 90.28 126.5 C85.78 137.91 56.42 175.29 16.01 178.47 C-19.27 180.28 -72.94 169.76 -96.48 125.05 C-97.1 130.22 -94.09 134.04 -90.21 139.71 C-102.41 134.4 -109.16 116.49 -104.98 102.33 C-106.41 94.07 -109.3 77.12 -110.92 70.21 C-115.02 75.7 -113.47 80.4 -114.79 85.65 C-119.99 65.71 -121.45 56.88 -106.43 38.58 C-101.99 33.34 -88.66 19.52 -87.05 17.9 C-91.75 19.59 -100.37 23.02 -102.5 23.52 C-100.02 15.59 -79.64 0.31 -45.76 -2.36 C-26.59 -11.66 -17.37 -38.29 -15.33 -88.53 C-13.08 -88.81 -12.25 -89.34 -10.08 -91.03 Z"/><path clip-rule="evenodd" d="M12.99 -173.06 C13.45 -173.06 14.39 -172.35 16.5 -170.95 C16.59 -170.46 16.6 -167.06 16.6 -166.33 C16.51 -161.86 15.81 -157.6 14.91 -153.22 C13.04 -144.63 13.29 -136.68 17.9 -129.53 C15.34 -130.16 13.57 -131.32 11.58 -133.04 C12.07 -130.56 16.47 -125.86 25.62 -124.97 C23.6 -124.26 21.13 -122.95 18.98 -123.03 C19.04 -120.65 20.75 -119.13 24.22 -117.59 C19.78 -116.7 13.49 -119.67 8.42 -123.91 C8.35 -121.91 9.15 -116.41 9.13 -115.49 C6.55 -115.77 0.97 -123.03 -1.4 -127.77 C0.32 -118.08 8.78 -109.87 14.04 -108.12 C13.89 -108.64 12.85 -113.63 12.99 -116.19 C14.9 -111.69 23.76 -103.09 33 -99.34 C31.01 -98.74 23.25 -99.14 20.71 -95.48 C19.27 -91.53 20.1 -84.42 23.87 -78.98 C15.67 -81.34 6.46 -94.33 2.73 -94.22 C0.73 -94.39 -4.33 -88.76 -4.56 -82.14 C-6.23 -84.16 -7.63 -88.61 -8.78 -95.48 C-10.06 -92.71 -16.35 -89.8 -20.71 -89.51 C-12.44 -99.9 -7.13 -114.6 -9.83 -123.91 C-15.91 -118.7 -15.74 -112.9 -20.05 -104.17 C-23.41 -96.8 -33.16 -89.81 -39.22 -91.19 C-33.85 -92.93 -29.29 -99.58 -27.48 -104.15 C-30.03 -103.58 -35.11 -104.2 -38.61 -106.71 C-22.24 -105.28 -12.7 -129.66 -12.99 -146.38 C-15.51 -144.95 -16.56 -141.93 -17.9 -139.36 C-18.07 -139.05 -21.49 -131.14 -22.01 -130.12 C-22.66 -128.98 -23.23 -127.56 -23.36 -127.08 C-24.36 -123.61 -25.51 -120.84 -28.78 -119 C-32.69 -117.31 -37.36 -117.67 -41.57 -117.72 C-40.98 -117.73 -29.5 -121.29 -30.28 -126.41 C-33.08 -126.19 -37.2 -127.99 -40.09 -130.63 C-39.95 -130.78 -31.72 -129.56 -26.33 -132.34 C-26.21 -132.7 -23.09 -140.32 -20.93 -145.57 C-19.19 -149.84 -13.35 -161.82 -4.21 -163.23 C-4.07 -163.86 -2.13 -168.37 -0.7 -168.84 C-2.01 -170.35 -6.93 -171.91 -7.72 -172.7 C-1.98 -175.97 7.26 -176.71 12.99 -173.06 Z M-2.46 -150.94 C-3.71 -150.19 -7.69 -144.11 -7.37 -140.06 C-1.78 -142.05 0.92 -147.5 -2.46 -150.94 Z"/></g></clipPath>
<symbol id="mk-dragon" viewBox="0 0 500 500">
<ellipse cx="262" cy="478" rx="112" ry="13" style="fill: var(--mk-shadow); opacity: calc(var(--mk-shadow-a) * var(--mk-gleam))"/>
<g style="opacity: var(--mk-cut-a)" transform="translate(250 250) scale(1.243) matrix(0.99997 -0.0075 0.0075 0.99997 0 0) translate(2.2 -1.6)"><path d="M-2.46 -150.94 C-3.71 -150.19 -7.69 -144.11 -7.37 -140.06 C-1.78 -142.05 0.92 -147.5 -2.46 -150.94 Z" style="fill: var(--mk-cut)"/></g>
<g transform="translate(250 250) scale(1.243) matrix(0.99997 -0.0075 0.0075 0.99997 0 0) translate(2.2 -1.6)" fill="url(#mkInkDragon)" fill-rule="evenodd" style="stroke: var(--mk-rim); stroke-opacity: var(--mk-rim-a); stroke-width: 4; stroke-linejoin: round">
<path d="M-10.08 -91.03 C-9.23 -87.35 -6.74 -79.58 -4.1 -77.91 C-2.18 -81.85 -1.29 -89.83 2.6 -91.22 C4.21 -92.75 16.04 -78.59 22.38 -77.36 C20.8 -10.16 -3.65 37.37 -41.09 45.75 C-59.35 52.72 -62.91 65.19 -63.03 81.72 C-63.31 103.14 -53.3 119.59 -27.73 129.53 C-31.08 129.67 -38.57 128.44 -39.67 128.48 C-17.51 144.13 20 150.92 47.16 130.67 C63.38 116.58 82.17 90.63 78.07 65.8 C76.2 55.29 68.52 40.93 57.59 37.14 C40.42 31.45 19.95 38.15 7.72 61.08 C41.3 93.66 8.23 137.29 -10.18 122.16 C2.85 121.16 6 113.97 3.39 105.41 C-3.67 93.03 -17.09 102.03 -26.83 86.78 C-32.97 72.93 -30.01 55.08 -7.02 55.81 C-2.71 39.58 15.95 17.54 37.56 13.34 C52.04 10.92 67.3 12.69 79.33 20.71 C92.12 20.2 111.63 41.29 111.63 41.77 C110.46 41.33 101.83 35.71 98.64 35.8 C100.13 37.25 105.79 43.95 107.89 46.47 C112.77 52.34 113.6 60.32 114.08 67.75 C113.54 67.48 109.51 59.27 108.82 58.27 C108.89 60.35 113.7 84.02 111.63 93.07 C109.72 90.19 109.3 88.8 106.33 88.76 C101.79 97.89 93.26 118.96 90.28 126.5 C85.78 137.91 56.42 175.29 16.01 178.47 C-19.27 180.28 -72.94 169.76 -96.48 125.05 C-97.1 130.22 -94.09 134.04 -90.21 139.71 C-102.41 134.4 -109.16 116.49 -104.98 102.33 C-106.41 94.07 -109.3 77.12 -110.92 70.21 C-115.02 75.7 -113.47 80.4 -114.79 85.65 C-119.99 65.71 -121.45 56.88 -106.43 38.58 C-101.99 33.34 -88.66 19.52 -87.05 17.9 C-91.75 19.59 -100.37 23.02 -102.5 23.52 C-100.02 15.59 -79.64 0.31 -45.76 -2.36 C-26.59 -11.66 -17.37 -38.29 -15.33 -88.53 C-13.08 -88.81 -12.25 -89.34 -10.08 -91.03 Z"/><path d="M12.99 -173.06 C13.45 -173.06 14.39 -172.35 16.5 -170.95 C16.59 -170.46 16.6 -167.06 16.6 -166.33 C16.51 -161.86 15.81 -157.6 14.91 -153.22 C13.04 -144.63 13.29 -136.68 17.9 -129.53 C15.34 -130.16 13.57 -131.32 11.58 -133.04 C12.07 -130.56 16.47 -125.86 25.62 -124.97 C23.6 -124.26 21.13 -122.95 18.98 -123.03 C19.04 -120.65 20.75 -119.13 24.22 -117.59 C19.78 -116.7 13.49 -119.67 8.42 -123.91 C8.35 -121.91 9.15 -116.41 9.13 -115.49 C6.55 -115.77 0.97 -123.03 -1.4 -127.77 C0.32 -118.08 8.78 -109.87 14.04 -108.12 C13.89 -108.64 12.85 -113.63 12.99 -116.19 C14.9 -111.69 23.76 -103.09 33 -99.34 C31.01 -98.74 23.25 -99.14 20.71 -95.48 C19.27 -91.53 20.1 -84.42 23.87 -78.98 C15.67 -81.34 6.46 -94.33 2.73 -94.22 C0.73 -94.39 -4.33 -88.76 -4.56 -82.14 C-6.23 -84.16 -7.63 -88.61 -8.78 -95.48 C-10.06 -92.71 -16.35 -89.8 -20.71 -89.51 C-12.44 -99.9 -7.13 -114.6 -9.83 -123.91 C-15.91 -118.7 -15.74 -112.9 -20.05 -104.17 C-23.41 -96.8 -33.16 -89.81 -39.22 -91.19 C-33.85 -92.93 -29.29 -99.58 -27.48 -104.15 C-30.03 -103.58 -35.11 -104.2 -38.61 -106.71 C-22.24 -105.28 -12.7 -129.66 -12.99 -146.38 C-15.51 -144.95 -16.56 -141.93 -17.9 -139.36 C-18.07 -139.05 -21.49 -131.14 -22.01 -130.12 C-22.66 -128.98 -23.23 -127.56 -23.36 -127.08 C-24.36 -123.61 -25.51 -120.84 -28.78 -119 C-32.69 -117.31 -37.36 -117.67 -41.57 -117.72 C-40.98 -117.73 -29.5 -121.29 -30.28 -126.41 C-33.08 -126.19 -37.2 -127.99 -40.09 -130.63 C-39.95 -130.78 -31.72 -129.56 -26.33 -132.34 C-26.21 -132.7 -23.09 -140.32 -20.93 -145.57 C-19.19 -149.84 -13.35 -161.82 -4.21 -163.23 C-4.07 -163.86 -2.13 -168.37 -0.7 -168.84 C-2.01 -170.35 -6.93 -171.91 -7.72 -172.7 C-1.98 -175.97 7.26 -176.71 12.99 -173.06 Z M-2.46 -150.94 C-3.71 -150.19 -7.69 -144.11 -7.37 -140.06 C-1.78 -142.05 0.92 -147.5 -2.46 -150.94 Z"/>
</g>
<g clip-path="url(#mkDragonClip)" style="opacity: calc(var(--mk-shine-a) * var(--mk-gleam))">
<path d="M126 285 C114 320 114 362 126 398" fill="none" stroke="url(#mkSharp)" stroke-width="12" stroke-linecap="round"/>
<path d="M240 150 C236 185 226 212 210 236" fill="none" style="stroke: var(--mk-shine)" stroke-width="6" stroke-linecap="round" opacity="0.45"/>
<path d="M290 278 C320 266 350 268 372 284" fill="none" style="stroke: var(--mk-shine)" stroke-width="6" stroke-linecap="round" opacity="0.4"/>
<path d="M380 392 C368 428 340 452 298 462" fill="none" style="stroke: var(--mk-shine)" stroke-width="5" stroke-linecap="round" opacity="0.25"/>
<ellipse cx="132" cy="300" rx="4" ry="9" transform="rotate(-18 132 300)" style="fill: var(--mk-shine)" opacity="0.9"/>
<ellipse cx="256" cy="48" rx="3.5" ry="7" transform="rotate(-40 256 48)" style="fill: var(--mk-shine)" opacity="0.85"/>
</g>
</symbol>
</defs>`;
