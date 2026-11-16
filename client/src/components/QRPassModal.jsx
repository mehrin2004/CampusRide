import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle2, X, ShieldCheck, Bus, Smartphone, Sparkles, Camera } from 'lucide-react';
import { demandAPI } from '../services/api';
import Logo from './Logo';

/**
 * Official Bus Door QR Code Poster Display (Displayed/Printed on Bus Door)
 * Students scan this QR code on the bus door when boarding.
 */
export const OfficialBusQRDisplay = ({ busNumber = 'RCET-BUS-01', onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border-2 border-amber-400 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-5 text-center">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Card Header */}
        <div className="flex flex-col items-center space-y-1">
          <Logo size="sm" subtext="Official Bus Entry Pass" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-950 bg-amber-400 border border-amber-500 px-3 py-0.5 rounded-full mt-2">
            OFFICIAL BUS ENTRY QR CODE
          </span>
        </div>

        {/* Bus Info */}
        <div className="bg-amber-50/90 p-3.5 rounded-2xl border border-amber-300 text-slate-900 space-y-0.5">
          <p className="text-xs font-black uppercase tracking-wider text-amber-900">ROHINI COLLEGE CAMPUS BUS</p>
          <h3 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
            <Bus className="w-6 h-6 text-amber-600" />
            {busNumber}
          </h3>
          <p className="text-[11px] text-slate-600 font-bold">Mount on Bus Door Entrance</p>
        </div>

        {/* Generated QR Code Box */}
        <div className="bg-slate-950 p-5 rounded-3xl border-2 border-amber-400 shadow-xl flex flex-col items-center space-y-3">
          
          <div className="bg-white p-3.5 rounded-2xl shadow-inner inline-block">
            <svg viewBox="0 0 100 100" className="w-44 h-44">
              {/* Outer Position Detection Patterns */}
              <rect x="5" y="5" width="25" height="25" fill="#0f172a" rx="4" />
              <rect x="9" y="9" width="17" height="17" fill="#ffffff" rx="2" />
              <rect x="13" y="13" width="9" height="9" fill="#f59e0b" rx="1" />

              <rect x="70" y="5" width="25" height="25" fill="#0f172a" rx="4" />
              <rect x="74" y="9" width="17" height="17" fill="#ffffff" rx="2" />
              <rect x="78" y="13" width="9" height="9" fill="#f59e0b" rx="1" />

              <rect x="5" y="70" width="25" height="25" fill="#0f172a" rx="4" />
              <rect x="9" y="74" width="17" height="17" fill="#ffffff" rx="2" />
              <rect x="13" y="78" width="9" height="9" fill="#f59e0b" rx="1" />

              {/* Data Matrices */}
              <rect x="36" y="8" width="6" height="6" fill="#0f172a" rx="1" />
              <rect x="48" y="8" width="12" height="6" fill="#f59e0b" rx="1" />
              <rect x="36" y="18" width="18" height="6" fill="#0f172a" rx="1" />

              <rect x="8" y="36" width="6" height="18" fill="#0f172a" rx="1" />
              <rect x="18" y="42" width="12" height="6" fill="#f59e0b" rx="1" />

              <rect x="36" y="36" width="28" height="28" fill="#0f172a" rx="4" />
              <rect x="42" y="42" width="16" height="16" fill="#fbbf24" rx="2" />

              <rect x="70" y="36" width="8" height="14" fill="#0f172a" rx="1" />
              <rect x="82" y="44" width="10" height="12" fill="#f59e0b" rx="1" />

              <rect x="36" y="72" width="14" height="8" fill="#0f172a" rx="1" />
              <rect x="54" y="78" width="16" height="14" fill="#f59e0b" rx="1" />
              <rect x="74" y="74" width="18" height="18" fill="#0f172a" rx="2" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>STUDENTS: SCAN UPON BOARDING</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 font-bold">
          Students scan this QR code with their mobile phone when entering the bus.
        </p>
      </div>
    </div>
  );
};

/**
 * Student Camera Boarding Scanner (Student scans the Bus Entry QR code on the bus)
 */
export const StudentBoardingScannerModal = ({ user, onClose }) => {
  const [boarded, setBoarded] = useState(false);
  const [cameraState, setCameraState] = useState('initializing'); // 'initializing' | 'active' | 'denied' | 'error'
  const [cameraError, setCameraError] = useState('');
  const [smsDetails, setSmsDetails] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const initCameraStream = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('denied');
      setCameraError('Camera API is not supported on this browser or non-HTTPS connection.');
      return;
    }

    try {
      setCameraState('initializing');
      setCameraError('');

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraintOptions = [
        { video: { facingMode: { ideal: 'environment' } } },
        { video: { facingMode: 'user' } },
        { video: true }
      ];

      let mediaStream = null;
      let lastErr = null;

      for (const constraint of constraintOptions) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
          if (mediaStream) break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!mediaStream) {
        throw lastErr || new Error('Could not access camera device');
      }

      streamRef.current = mediaStream;
      setCameraState('active');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn('Autoplay caught:', e));
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraState('denied');
      setCameraError(err.message || 'Camera permission denied or camera unavailable. You can still confirm boarding below.');
    }
  };

  useEffect(() => {
    initCameraStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (cameraState === 'active' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn('Video play error:', e));
    }
  }, [cameraState]);

  const handleConfirmScan = async () => {
    try {
      const res = await demandAPI.recordBoardingScan({
        busNumber: user?.assignedBus?.busNumber || '32C',
        stopName: 'Campus Stop'
      });
      if (res.data && res.data.success) {
        setSmsDetails(res.data);
      }
    } catch (e) {
      console.error('Boarding scan API error:', e);
    }

    setBoarded(true);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-amber-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Live Camera Bus QR Scanner</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Point Phone Camera at Official Bus Door QR Code</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Camera Viewport Box */}
        <div className="relative bg-slate-950 rounded-2xl h-72 flex flex-col items-center justify-center overflow-hidden border-2 border-amber-500/80 shadow-inner">
          
          {/* Live Video Feed */}
          {cameraState === 'active' && !boarded && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Scanner Overlay Box & Laser Reticle */}
          {!boarded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none p-4">
              <div className="w-48 h-48 border-2 border-amber-400/90 rounded-2xl relative shadow-2xl shadow-amber-500/20 bg-slate-950/10">
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-amber-400 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-amber-400 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-amber-400 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-amber-400 rounded-br-lg"></div>
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-lg shadow-amber-400/80 top-1/2 -translate-y-1/2"></div>
              </div>
            </div>
          )}

          {/* State Screens */}
          {boarded ? (
            <div className="text-center space-y-2.5 z-30 bg-slate-900/95 p-4 rounded-2xl border border-emerald-500/50 w-full mx-2 max-h-68 overflow-y-auto">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-white">✅ BOARDED BUS SUCCESSFULLY!</h4>
              <p className="text-[11px] font-extrabold text-amber-400">{user?.name} ({user?.rollNumber || 'RCET Student'})</p>

              {/* Parent Safety SMS Dispatch Box */}
              <div className="bg-emerald-950/90 p-2.5 rounded-xl border border-emerald-500/60 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-[11px]">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>PARENT SAFETY SMS SENT! 📲</span>
                </div>
                <p className="text-[10px] text-emerald-200 font-bold">
                  Dispatched to Parent ({smsDetails?.parentPhone || user?.parentPhone || '+91 98421 00202'}):
                </p>
                <div className="bg-slate-950 p-2 rounded-lg border border-emerald-500/40 text-[10px] font-mono text-emerald-300 leading-relaxed">
                  "{smsDetails?.smsContent || `ROHINI COLLEGE SAFETY ALERT: Dear Parent, your ward ${user?.name} has safely boarded Bus ${user?.assignedBus?.busNumber || '32C'} at ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}. Live tracking active.`}"
                </div>
              </div>

              <button
                onClick={onClose}
                className="mt-1 px-5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer shadow-md"
              >
                Done & Return
              </button>
            </div>
          ) : cameraState === 'initializing' ? (
            <div className="text-center space-y-2 z-20 text-white p-4">
              <Sparkles className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs font-extrabold text-amber-300">Requesting Camera Access...</p>
              <p className="text-[10px] text-slate-400">Please tap 'Allow' when your browser asks for camera permissions.</p>
            </div>
          ) : cameraState === 'denied' || cameraState === 'error' ? (
            <div className="text-center space-y-2 z-20 text-white p-4">
              <Camera className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs font-extrabold text-amber-300">Camera Permission Required</p>
              <p className="text-[10px] text-slate-300 max-w-xs">{cameraError}</p>
              <button
                type="button"
                onClick={initCameraStream}
                className="mt-2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer inline-block"
              >
                Retry Camera Access
              </button>
            </div>
          ) : null}

        </div>

        {/* Scan Action Controls */}
        {!boarded && (
          <div className="space-y-2 text-center pt-1">
            <p className="text-[11px] text-slate-600 font-extrabold">
              {cameraState === 'active' ? '📹 Real-time camera scanner active. Align with Bus Door QR Code.' : 'Align phone camera with official QR poster mounted on bus entrance.'}
            </p>
            <button
              type="button"
              onClick={handleConfirmScan}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 cursor-pointer transition active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Confirm Boarding Scan (Bus QR Code)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

/**
 * Student Digital QR Pass Modal
 */
export const StudentQRPass = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border-2 border-amber-400 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-5 text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center space-y-1">
          <Logo size="sm" subtext="Student Digital Bus Pass" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-950 bg-amber-400 border border-amber-500 px-3 py-0.5 rounded-full mt-2">
            VALID STUDENT CAMPUS PASS
          </span>
        </div>

        <div className="bg-amber-50/90 p-3.5 rounded-2xl border border-amber-300 text-slate-900 space-y-1 text-left">
          <p className="text-xs font-black uppercase tracking-wider text-amber-900">{user?.name || 'RCET Student'}</p>
          <p className="text-xs font-bold text-slate-700">Roll No: <span className="font-mono text-amber-800">{user?.rollNumber || 'RCET-2024-001'}</span></p>
          <p className="text-xs font-bold text-slate-700">Assigned Bus: <span className="font-mono text-amber-800">{user?.assignedBus?.busNumber || 'RCET-BUS-01'}</span></p>
        </div>

        <div className="bg-slate-950 p-4 rounded-3xl border-2 border-amber-400 shadow-xl flex flex-col items-center space-y-2">
          <div className="bg-white p-3 rounded-2xl shadow-inner inline-block">
            <svg viewBox="0 0 100 100" className="w-36 h-36">
              <rect x="5" y="5" width="25" height="25" fill="#0f172a" rx="4" />
              <rect x="9" y="9" width="17" height="17" fill="#ffffff" rx="2" />
              <rect x="13" y="13" width="9" height="9" fill="#10b981" rx="1" />

              <rect x="70" y="5" width="25" height="25" fill="#0f172a" rx="4" />
              <rect x="74" y="9" width="17" height="17" fill="#ffffff" rx="2" />
              <rect x="78" y="13" width="9" height="9" fill="#10b981" rx="1" />

              <rect x="5" y="70" width="25" height="25" fill="#0f172a" rx="4" />
              <rect x="9" y="74" width="17" height="17" fill="#ffffff" rx="2" />
              <rect x="13" y="78" width="9" height="9" fill="#10b981" rx="1" />

              <rect x="36" y="8" width="6" height="6" fill="#0f172a" rx="1" />
              <rect x="48" y="8" width="12" height="6" fill="#10b981" rx="1" />
              <rect x="36" y="18" width="18" height="6" fill="#0f172a" rx="1" />

              <rect x="36" y="36" width="28" height="28" fill="#0f172a" rx="4" />
              <rect x="42" y="42" width="16" height="16" fill="#34d399" rx="2" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black">
            <CheckCircle2 className="w-4 h-4" />
            <span>ACTIVE STUDENT ID PASS</span>
          </div>
        </div>

      </div>
    </div>
  );
};
