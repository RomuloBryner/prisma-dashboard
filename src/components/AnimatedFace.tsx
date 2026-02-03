import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

type Emotion = 'neutral' | 'happy' | 'sad' | 'angry';

const AnimatedFace = () => {
  const [emotion, setEmotion] = useState<Emotion>('neutral');
  const [isTalking, setIsTalking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isTalkingRef = useRef(false); // Referencia para rastrear el estado de habla
  const actualStartTimeRef = useRef<number | null>(null); // Tiempo real cuando empezó el TTS
  const actualDurationRef = useRef<number | null>(null); // Duración real calculada

  // --- CONFIGURACIÓN DE ANIMACIONES ---

  // 1. Lógica del Fondo (Boca) - Movimiento horizontal según emoción
  // Triste: mover hacia la DERECHA (x positivo)
  // Feliz: mover hacia la IZQUIERDA (x negativo)
  // Neutro: centrado (x: 0)
  const bgVariants = {
    neutral: { 
      x: 0, // Fondo centrado
      transition: { type: "spring" as const, stiffness: 40 }
    },
    happy: { 
      x: -750, // Mueve el fondo a la izquierda para boca feliz
      y: 200,
      transition: { type: "spring" as const, stiffness: 40 }
    },
    sad: { 
      x: 450, // Mueve el fondo a la derecha para boca triste
      transition: { type: "spring" as const, stiffness: 40 }
    },
    angry: {
      x: 100, // Movimiento intermedio para enojado
      transition: { type: "spring" as const, stiffness: 40 }
    }
  };


  // 3. Lógica de las Cejas según emoción
  const eyebrowLeftVariants = {
    neutral: { rotate: 0, y: 0 },
    happy: { rotate: 0, y: 0 },
    sad: { rotate: -20, y: -20 }, // Gira hacia afuera para tristeza
    angry: { rotate: 25, y: 10 } // Cejas fruncidas hacia abajo
  };
  
  const eyebrowRightVariants = {
    neutral: { rotate: 0, y: 0 },
    happy: { rotate: 0, y: 0 },
    sad: { rotate: 20, y: -20 }, // Espejo de la izquierda
    angry: { rotate: -25, y: 10 } // Cejas fruncidas hacia abajo
  };

  // 4. Lógica de los Ojos - Movimiento de pupilas (mirar alrededor)
  const pupilLeftVariants = {
    looking: {
      x: [0, -15, 15, -10, 10, 0],
      y: [0, -10, 5, -5, 10, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut" as const,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1]
      }
    }
  };

  const pupilRightVariants = {
    looking: {
      x: [0, -15, 15, -10, 10, 0],
      y: [0, -10, 5, -5, 10, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut" as const,
        times: [0, 0.2, 0.4, 0.6, 0.8, 1]
      }
    }
  };


  // Función para hablar con sincronización de audio
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.error('SpeechSynthesis no está disponible');
      return;
    }

    // Cancelar cualquier habla anterior
    window.speechSynthesis.cancel();

    if (!text || !text.trim()) {
      console.warn('Texto vacío, no se puede reproducir');
      return;
    }

    // Calcular duración estimada basada en la velocidad de habla
    // Rate 0.95 significa 95% de velocidad normal
    // Velocidad normal en español: ~150 palabras/minuto = ~2.5 palabras/segundo
    // Promedio: ~5 caracteres por palabra (con espacios)
    const rate = 0.95;
    const wordsPerMinute = 150 * rate; // Ajustar por rate
    const charsPerSecond = (wordsPerMinute / 60) * 5; // Aproximadamente 5 chars por palabra
    const estimatedDuration = text.length / charsPerSecond;
    
    // Guardar la duración estimada
    actualDurationRef.current = estimatedDuration;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = rate;
    utterance.pitch = 0.95;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      console.log('[AnimatedFace] TTS iniciado en tiempo real');
      // Guardar el tiempo real cuando empezó
      actualStartTimeRef.current = Date.now();
      isTalkingRef.current = true;
      setIsTalking(true);
      
      // Iniciar análisis de audio sincronizado con el tiempo real
      startAudioSimulation();
    };

    // Usar eventos de boundary si están disponibles para sincronización más precisa
    utterance.onboundary = (event) => {
      // Este evento se dispara cuando se alcanza un límite de palabra o frase
      // Podemos usarlo para ajustar la sincronización
      if (event.name === 'word' || event.name === 'sentence') {
        const elapsed = (Date.now() - (actualStartTimeRef.current || Date.now())) / 1000;
        const expectedTime = event.charIndex / charsPerSecond;
        const timeDiff = elapsed - expectedTime;
        
        // Si hay una diferencia significativa, ajustar la duración
        if (Math.abs(timeDiff) > 0.1) {
          console.log(`[AnimatedFace] Ajuste de sincronización: ${timeDiff.toFixed(2)}s`);
          // Ajustar la duración estimada basándose en la diferencia
          if (actualDurationRef.current) {
            actualDurationRef.current = actualDurationRef.current + timeDiff;
          }
        }
      }
    };

    utterance.onend = () => {
      const actualDuration = actualStartTimeRef.current ? 
        (Date.now() - actualStartTimeRef.current) / 1000 : null;
      console.log(`[AnimatedFace] TTS finalizado. Duración real: ${actualDuration?.toFixed(2)}s`);
      
      isTalkingRef.current = false;
      setIsTalking(false);
      setAudioLevel(0);
      stopAudioSimulation();
      utteranceRef.current = null;
      actualStartTimeRef.current = null;
      actualDurationRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('[AnimatedFace] Error en TTS:', event);
      isTalkingRef.current = false;
      setIsTalking(false);
      setAudioLevel(0);
      stopAudioSimulation();
      utteranceRef.current = null;
      actualStartTimeRef.current = null;
      actualDurationRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Función para determinar el nivel de apertura de boca según el fonema
  const getPhonemeMouthOpening = useCallback((char: string): number => {
    const lowerChar = char.toLowerCase();
    
    // Vocales: alta apertura de boca (0.7 - 1.0)
    if (/[aeiouáéíóúü]/.test(lowerChar)) {
      // Vocales abiertas (a, e, o) requieren más apertura
      if (/[aeoáéó]/.test(lowerChar)) return 0.85 + Math.random() * 0.15;
      // Vocales cerradas (i, u) requieren menos apertura
      return 0.65 + Math.random() * 0.2;
    }
    
    // Consonantes sonoras (vibración de cuerdas vocales): apertura media-alta (0.5 - 0.8)
    if (/[bdgjlmnrvwyzñ]/.test(lowerChar)) {
      // Nasales (m, n, ñ) y líquidas (l, r) requieren más apertura
      if (/[mnñlr]/.test(lowerChar)) return 0.6 + Math.random() * 0.2;
      // Otras sonoras
      return 0.5 + Math.random() * 0.25;
    }
    
    // Consonantes sordas (sin vibración): apertura media-baja (0.3 - 0.6)
    if (/[ptkfschx]/.test(lowerChar)) {
      // Fricativas (f, s, ch) requieren más apertura que oclusivas (p, t, k)
      if (/[fschx]/.test(lowerChar)) return 0.4 + Math.random() * 0.2;
      return 0.3 + Math.random() * 0.2;
    }
    
    // Caracteres especiales o desconocidos: apertura media
    return 0.4 + Math.random() * 0.3;
  }, []);

  // Función para analizar segmentos fonéticos del texto
  const analyzePhoneticSegments = useCallback((text: string, duration: number) => {
    const segments: Array<{ start: number; end: number; opening: number }> = [];
    
    // Calcular tiempo por carácter de habla
    const speechChars = text.replace(/[\s.,!?;:]/g, '').length;
    const charTime = speechChars > 0 ? duration / speechChars : 0.12;
    
    let currentTime = 0;
    
    // Recorrer el texto carácter por carácter
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const isSpace = /\s/.test(char);
      const isPunctuation = /[.,!?;:]/.test(char);
      
      if (isPunctuation) {
        // Pausa en puntuación - boca cerrada
        if (i > 0 && !/\s/.test(text[i - 1])) {
          currentTime += charTime;
        }
        
        const pauseDuration = /[.!?]/.test(char) ? 0.45 : 0.25;
        segments.push({
          start: currentTime,
          end: currentTime + pauseDuration,
          opening: 0.05
        });
        currentTime += pauseDuration;
      } else if (isSpace) {
        // Espacio - pausa corta
        const spaceCount = (text.slice(i).match(/^\s+/)?.[0]?.length || 1);
        const pauseDuration = spaceCount > 1 ? 0.12 : 0.06;
        segments.push({
          start: currentTime,
          end: currentTime + pauseDuration,
          opening: spaceCount > 1 ? 0.2 : 0.3
        });
        currentTime += pauseDuration;
        i += spaceCount - 1;
      } else {
        // Carácter de habla - calcular apertura según fonema
        const opening = getPhonemeMouthOpening(char);
        segments.push({
          start: currentTime,
          end: currentTime + charTime,
          opening: opening
        });
        currentTime += charTime;
      }
    }
    
    return segments;
  }, [getPhonemeMouthOpening]);

  // Función para analizar el texto y detectar pausas reales
  const analyzeTextPauses = useCallback((text: string, duration: number) => {
    const pauses: Array<{ start: number; end: number; intensity: number }> = [];
    
    // Calcular tiempo por carácter (sin contar espacios y puntuación como tiempo de habla)
    const speechChars = text.replace(/\s/g, '').length;
    const charTime = speechChars > 0 ? duration / speechChars : 0.12;
    
    let currentTime = 0;
    let charIndex = 0;
    
    // Recorrer el texto carácter por carácter
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const isSpace = /\s/.test(char);
      const isPunctuation = /[.,!?;:]/.test(char);
      
      if (isPunctuation) {
        // Calcular tiempo de pronunciación del carácter anterior (si existe)
        if (i > 0 && !/\s/.test(text[i - 1])) {
          currentTime += charTime;
        }
        
        // Detectar tipo de pausa
        if (/[.!?]/.test(char)) {
          // Pausa larga (punto, exclamación, interrogación) - 400-500ms
          const pauseStart = currentTime;
          const pauseDuration = 0.45;
          pauses.push({
            start: pauseStart,
            end: pauseStart + pauseDuration,
            intensity: 0.05 // Boca casi cerrada
          });
          currentTime += pauseDuration;
        } else if (/[,;:]/.test(char)) {
          // Pausa media (coma, punto y coma, dos puntos) - 200-300ms
          const pauseStart = currentTime;
          const pauseDuration = 0.25;
          pauses.push({
            start: pauseStart,
            end: pauseStart + pauseDuration,
            intensity: 0.15 // Boca parcialmente cerrada
          });
          currentTime += pauseDuration;
        }
      } else if (isSpace) {
        // Espacios - pausa corta
        const spaceCount = (text.slice(i).match(/^\s+/)?.[0]?.length || 1);
        if (spaceCount > 1) {
          // Múltiples espacios - pausa más larga
          const pauseStart = currentTime;
          const pauseDuration = 0.12;
          pauses.push({
            start: pauseStart,
            end: pauseStart + pauseDuration,
            intensity: 0.25
          });
          currentTime += pauseDuration;
          i += spaceCount - 1; // Saltar los espacios adicionales
        } else {
          // Espacio simple - pausa muy corta
          const pauseStart = currentTime;
          const pauseDuration = 0.06;
          pauses.push({
            start: pauseStart,
            end: pauseStart + pauseDuration,
            intensity: 0.35
          });
          currentTime += pauseDuration;
        }
      } else {
        // Carácter de habla normal
        currentTime += charTime;
        charIndex++;
      }
    }
    
    return pauses;
  }, []);

  // Simulación de audio basada en tiempo (ya que no podemos acceder al stream real)
  const startAudioSimulation = useCallback(() => {
    // Detener cualquier simulación anterior
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Usar el tiempo real cuando empezó el TTS, o el tiempo actual como fallback
    const startTime = actualStartTimeRef.current || Date.now();
    const text = utteranceRef.current?.text || '';
    
    // Usar la duración real calculada, o calcular una estimación
    let duration = actualDurationRef.current;
    if (!duration) {
      // Fallback: calcular basándose en rate y longitud
      const rate = 0.95;
      const wordsPerMinute = 150 * rate;
      const charsPerSecond = (wordsPerMinute / 60) * 5;
      duration = text.length / charsPerSecond;
    }
    
    // Asegurar una duración mínima y que no sea null
    const finalDuration = Math.max(1, duration || 2);
    
    console.log(`[AnimatedFace] Duración estimada: ${finalDuration.toFixed(2)}s para texto de ${text.length} caracteres`);
    
    // Analizar segmentos fonéticos del texto con la duración real
    const phoneticSegments = analyzePhoneticSegments(text, finalDuration);
    
    // Analizar pausas reales en el texto con la duración real
    const pauses = analyzeTextPauses(text, finalDuration);

    const simulateAudio = () => {
      // Usar la referencia en lugar del estado para evitar problemas de timing
      if (!isTalkingRef.current) {
        setAudioLevel(0);
        return;
      }

      // Calcular tiempo transcurrido desde el inicio real del TTS
      const currentRealTime = Date.now();
      const elapsed = actualStartTimeRef.current ? 
        (currentRealTime - actualStartTimeRef.current) / 1000 : 
        (currentRealTime - startTime) / 1000;
      
      const progress = Math.min(elapsed / finalDuration, 1);
      const currentTime = elapsed;

      if (progress >= 1 || elapsed > finalDuration) {
        setAudioLevel(0);
        isTalkingRef.current = false;
        setIsTalking(false);
        return;
      }

      // Encontrar el segmento fonético actual
      let currentSegment = phoneticSegments.find(
        seg => currentTime >= seg.start && currentTime <= seg.end
      );
      
      // Si no encontramos un segmento exacto, buscar el más cercano
      if (!currentSegment) {
        currentSegment = phoneticSegments.find(seg => currentTime < seg.end) || 
                        phoneticSegments[phoneticSegments.length - 1] ||
                        { start: 0, end: finalDuration, opening: 0.5 };
      }

      // Verificar si estamos en una pausa real detectada del texto
      let isInPause = false;
      let pauseIntensity = 1.0;
      const pauseTransitionTime = 0.05; // Tiempo de transición suave (50ms)
      
      for (const pause of pauses) {
        // Verificar si estamos dentro de la pausa
        if (currentTime >= pause.start && currentTime <= pause.end) {
          isInPause = true;
          
          // Calcular transición suave al entrar y salir de la pausa
          if (currentTime - pause.start < pauseTransitionTime) {
            // Transición suave al entrar en la pausa
            const transitionProgress = (currentTime - pause.start) / pauseTransitionTime;
            pauseIntensity = pause.intensity + (currentSegment.opening - pause.intensity) * (1 - transitionProgress);
          } else if (pause.end - currentTime < pauseTransitionTime) {
            // Transición suave al salir de la pausa
            const transitionProgress = (pause.end - currentTime) / pauseTransitionTime;
            pauseIntensity = pause.intensity + (currentSegment.opening - pause.intensity) * (1 - transitionProgress);
          } else {
            // En el medio de la pausa, usar la intensidad completa
            pauseIntensity = pause.intensity;
          }
          break;
        }
      }

      // Usar la apertura del segmento fonético actual
      const baseOpening = currentSegment.opening;
      
      // Si estamos en una pausa, aplicar el factor de pausa
      const pauseFactor = isInPause ? pauseIntensity : 1.0;

      // Agregar micro-variaciones para simular vibración natural de la voz
      // Onda rápida para simular vibraciones de voz (25-30 Hz)
      const fastWave = Math.sin(currentTime * Math.PI * 28) * 0.1;
      // Onda media para simular variaciones naturales (8-10 Hz)
      const mediumWave = Math.sin(currentTime * Math.PI * 9) * 0.05;
      
      // Aplicar el factor de pausa y las micro-variaciones
      let adjustedLevel = baseOpening * pauseFactor;
      
      // Agregar variaciones solo si no estamos en una pausa
      if (!isInPause) {
        adjustedLevel += fastWave + mediumWave;
        
        // Agregar pequeña variación aleatoria para naturalidad
        const randomVariation = (Math.random() - 0.5) * 0.08;
        adjustedLevel += randomVariation;
      }
      
      // Asegurar que el nivel esté dentro de los límites
      const minLevel = isInPause ? pauseIntensity : 0.15;
      const level = Math.max(minLevel, Math.min(1.0, adjustedLevel));
      
      setAudioLevel(level);
      animationFrameRef.current = requestAnimationFrame(simulateAudio);
    };

    // Iniciar inmediatamente con el nivel del primer segmento
    const initialLevel = phoneticSegments.length > 0 ? phoneticSegments[0].opening : 0.4;
    setAudioLevel(initialLevel);
    animationFrameRef.current = requestAnimationFrame(simulateAudio);
  }, [analyzeTextPauses, analyzePhoneticSegments]);

  const stopAudioSimulation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isTalkingRef.current = false;
    setAudioLevel(0);
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 gap-8">
      
      {/* --- SVG CONTAINER --- */}
      <div className="w-[300px] h-[533px] relative bg-black overflow-hidden border border-gray-700 rounded-lg">
        <svg 
          viewBox="0 0 1080 1920" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <clipPath id="clip0_1291_1250">
              <rect width="1080" height="1920" fill="white" transform="translate(1080 1920) rotate(-180)"/>
            </clipPath>
          </defs>

          <g clipPath="url(#clip0_1291_1250)">
            {/* Fondo negro base */}
            <rect width="1080" height="1920" transform="translate(1080 1920) rotate(-180)" fill="black"/>
            
            {/* Grupo contenedor que mueve ambos paths (blanco y azul) horizontalmente según emoción */}
            <motion.g
              variants={bgVariants}
              animate={emotion}
            >
              {/* Path Negro con borde blanco */}
              <path d="M-3521.92 3397.97C-3521.92 2472.67 -3212.55 1620.22 -2691.8 937.971L-2691.74 937.893C-2366.75 511.945 -1960.46 151.822 -1496.39 -117.011L-1496.09 -117.183L-1495.79 -117.357C-897.657 -464.962 -202.917 -663.425 540.243 -663.425L588.185 -663.425C1087.4 -657.651 1563.99 -562.318 2003.6 -392.496C1654.71 -98.5196 1231.22 80.3202 778.215 127.42C776.304 127.596 774.482 127.762 772.891 127.909C771.443 128.042 770.134 128.162 768.909 128.274C692.929 122.742 616.515 119.989 540.243 119.989C454.769 119.989 368.72 123.444 283.694 130.427C254.058 132.163 226.495 134.716 208.265 136.373L205.411 136.633L202.562 136.925L193.8 137.834C-550.499 216.096 -1242.17 543.873 -1777.56 1080.26L-1777.56 1080.26C-1911.53 1214.19 -2032.96 1358.56 -2140.76 1510.71L-2141.61 1511.68L-2146.38 1518.56C-2149.8 1523.24 -2152.77 1527.47 -2155.29 1531.14C-2157.53 1534.41 -2159.58 1537.47 -2161.42 1540.28C-2535.87 2082.99 -2737.82 2726.12 -2737.82 3397.97C-2737.82 4272.37 -2396.06 5096.76 -1777.28 5715.4L-1776.99 5715.68C-1158.58 6332.96 -334.32 6675.67 540.523 6675.67C1415.01 6675.67 2240.67 6333.19 2858.32 5715.4L2858.32 5715.4C3477.11 5096.76 3818.86 4272.37 3818.86 3397.97C3818.86 3143.49 3789.94 2893.21 3733.54 2650.7C3937.14 2533.97 4178.03 2380.7 4420.73 2191.76C4538.97 2572.09 4602.69 2977.13 4602.69 3397.97C4602.69 5639.46 2810.75 7443.81 568.622 7459.09L568.622 7459.09C-1687.64 7474.36 -3521.92 5649.84 -3521.92 3397.97ZM4728.64 1931.39L4728.67 1931.36L4728.7 1931.33C4728.68 1931.35 4728.66 1931.37 4728.64 1931.39Z" fill="black" stroke="white" strokeWidth="1000"/>
              
              {/* Path Negro con borde Azul - Se mueve verticalmente para simular habla */}
              <motion.g
                style={{
                  y: isTalking ? audioLevel * 120 : 0, // Aumentado a 120 para más movimiento visible
                }}
                animate={{
                  y: isTalking ? audioLevel * 120 : 0,
                }}
                transition={isTalking ? {
                  duration: 0.03, // Actualización muy rápida (30ms) para movimiento fluido
                  ease: "easeOut" as const // EaseOut para movimiento más natural
                } : {
                  type: "spring" as const,
                  stiffness: 100,
                  damping: 15
                }}
              >
                <path d="M-3521.92 -2097.69C-3521.92 -4337.07 -1708.45 -6153.6 530.503 -6158.99L578.95 -6158.54C2816.88 -6138.04 4630.5 -4283.31 4602.73 -2045.44L4602.73 -2045.44C4591.5 -1143.78 4287.28 -314.315 3779.73 355.016L3773.75 362.883C3449.4 787.925 3042.19 1147.31 2576.95 1417.85C1978.2 1764.72 1283.34 1963.99 540.806 1963.99C23.3005 1963.99 -469.108 1867.74 -922.553 1692.54C-573.729 1398.71 -150.362 1219.96 302.497 1172.87C330.111 1170.35 333.437 1169.98 338.199 1169.79L349.479 1169.35L360.728 1168.41C419.937 1163.42 480.136 1160.9 540.523 1160.9C600.993 1160.9 661.416 1163.42 720.159 1168.39L741.195 1170.17L762.308 1170.17C811.3 1170.17 854.649 1165.8 878.203 1163.35L878.204 1163.35C1626.04 1086.73 2321.21 758.335 2858.76 219.587L2858.76 219.587C2992.56 85.7708 3113.85 -58.4482 3221.54 -210.441L3222.38 -211.41L3227.14 -218.273C3230.55 -222.941 3233.51 -227.154 3236.02 -230.814C3238.27 -234.091 3240.33 -237.168 3242.17 -239.979C3616.63 -782.702 3818.58 -1425.83 3818.58 -2097.69C3818.58 -2972.09 3476.83 -3796.48 2858.04 -4415.12L2858.04 -4415.12C2239.85 -5034.01 1414.37 -5375.39 540.243 -5375.39C-334.255 -5375.39 -1158.78 -5033.76 -1777.56 -4415.12C-2396.34 -3796.48 -2738.1 -2972.09 -2738.1 -2097.69C-2738.1 -1864.14 -2713.79 -1633.76 -2665.99 -1409.46C-2935.38 -1232.4 -3158.4 -1058.67 -3341.61 -897.079C-3458.81 -1276.08 -3521.92 -1679.11 -3521.92 -2097.69Z" fill="black" stroke="#43BCFF" strokeWidth="1000"/>
              </motion.g>
            </motion.g>

            {/* OJO IZQUIERDO */}
            <g>
              <circle cx="312.506" cy="364.5" r="92" transform="rotate(-180 312.506 364.5)" fill="white" stroke="black" strokeWidth="15"/>
              <motion.ellipse 
                cx="313.006" 
                cy="365.5" 
                rx="40" 
                ry="41.5" 
                transform="rotate(-180 313.006 365.5)" 
                fill="black"
                variants={pupilLeftVariants}
                animate="looking"
              />
            </g>

            {/* OJO DERECHO */}
            <g>
              <path d="M768.506 456.5C717.696 456.5 676.506 415.31 676.506 364.5C676.506 313.69 717.696 272.5 768.506 272.5C819.316 272.5 860.506 313.69 860.506 364.5C860.506 415.31 819.316 456.5 768.506 456.5Z" fill="white" stroke="black" strokeWidth="15"/>
              <motion.ellipse 
                cx="769.006" 
                cy="365.5" 
                rx="40" 
                ry="41.5" 
                transform="rotate(-180 769.006 365.5)" 
                fill="black"
                variants={pupilRightVariants}
                animate="looking"
              />
            </g>

            {/* CEJA DERECHA */}
            <motion.path 
              d="M921.084 266.318C913.491 237.844 898.534 210.983 876.215 188.663L876.215 188.679C853.842 166.306 826.891 151.319 798.341 143.756C776.212 137.861 753.118 136.478 730.522 139.516L661.556 157.995L678.809 222.383L735.079 207.305C735.079 207.305 747.46 205.669 753.767 205.67C778.272 205.643 801.511 213.975 820.261 229.24C820.895 229.768 821.528 230.296 822.14 230.847C824.267 232.643 826.35 234.559 828.342 236.551C830.334 238.543 832.243 240.618 834.046 242.754C834.627 243.335 835.269 243.855 835.903 244.384C854.66 259.641 877.891 267.98 902.396 267.953C908.703 267.954 914.965 267.396 921.084 266.318Z" 
              fill="black"
              variants={eyebrowRightVariants}
              animate={emotion}
              style={{ originX: 0.5, originY: 0.5 }} 
            />

            {/* CEJA IZQUIERDA */}
            <motion.path 
              d="M159.568 266.318C167.162 237.844 182.118 210.983 204.438 188.663L204.438 188.679C226.81 166.306 253.761 151.319 282.311 143.756C304.44 137.861 327.534 136.478 350.13 139.516L419.096 157.995L401.844 222.383L345.573 207.305C345.573 207.305 333.192 205.669 326.885 205.67C302.38 205.643 279.142 213.975 260.392 229.24C259.758 229.768 259.124 230.296 258.513 230.847C256.385 232.643 254.302 234.559 252.31 236.551C250.318 238.543 248.409 240.618 246.606 242.754C246.025 243.335 245.384 243.855 244.75 244.384C225.992 259.641 202.761 267.98 178.256 267.953C171.949 267.954 165.687 267.396 159.568 266.318Z" 
              fill="black"
              variants={eyebrowLeftVariants}
              animate={emotion}
              style={{ originX: 0.5, originY: 0.5 }}
            />
          </g>
        </svg>
      </div>

      {/* --- CONTROLES --- */}
      <div className="flex flex-col gap-4 items-center">
        <div className="flex gap-4 flex-wrap justify-center">
          <button 
            onClick={() => setEmotion('neutral')}
            className={`px-6 py-3 rounded-full font-bold transition-colors text-white ${
              emotion === 'neutral' 
                ? 'bg-gray-500 hover:bg-gray-600' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            Neutro 😐
          </button>
          
          <button 
            onClick={() => setEmotion('happy')}
            className={`px-6 py-3 rounded-full font-bold transition-colors text-white ${
              emotion === 'happy' 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            Feliz 😊
          </button>
          
          <button 
            onClick={() => setEmotion('sad')}
            className={`px-6 py-3 rounded-full font-bold transition-colors text-white ${
              emotion === 'sad' 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            Triste 😢
          </button>
          
          <button 
            onClick={() => setEmotion('angry')}
            className={`px-6 py-3 rounded-full font-bold transition-colors text-white ${
              emotion === 'angry' 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            Enojado 😠
          </button>
        </div>
        
        <div className="flex flex-col gap-4 items-center">
          <button 
            onClick={() => {
              if (isTalking || isTalkingRef.current) {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                isTalkingRef.current = false;
                setIsTalking(false);
                setAudioLevel(0);
                stopAudioSimulation();
              } else {
                speak("Hola, soy Prisma. ¿Cómo puedo ayudarte hoy?");
              }
            }}
            className={`px-6 py-3 rounded-full font-bold transition-colors text-white ${isTalking ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isTalking ? "Callar 🤫" : "Hablar 🗣️"}
          </button>
          
          <input
            type="text"
            placeholder="Escribe algo para que Prisma lo diga..."
            className="px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 min-w-[300px]"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                speak(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnimatedFace;
