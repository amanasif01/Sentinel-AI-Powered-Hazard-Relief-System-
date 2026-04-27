import './FloatingParticles.css';
import { useRef, useEffect, useCallback, useState } from 'react';

const FloatingParticles = () => {
  const particlesRef = useRef(null);
  const particles = useRef([]);

  // Optimized particle creation with minimal DOM manipulation
  const createParticle = useCallback(() => {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Use transform3d for hardware acceleration but reduce complexity
    particle.style.transform = 'translate3d(0, 0, 0)';
    particle.style.willChange = 'transform';
    
    return particle;
  }, []);

  // Optimized particle initialization with reduced effects
  const initializeParticle = useCallback((particle) => {
    // Random positioning with better distribution
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    particle.style.left = x + '%';
    particle.style.top = y + '%';
    
    // Significantly reduced animation timing for better performance
    const duration = Math.random() * 2 + 3; // 3-5s range (reduced from 4-7s)
    const delay = Math.random() * 2; // 0-2s delay (reduced from 0-4s)
    
    particle.style.animationDuration = duration + 's';
    particle.style.animationDelay = delay + 's';
    
    // Optimized size and opacity for good balance
    const size = Math.random() * 1.5 + 1; // 1-2.5px range
    const opacity = Math.random() * 0.4 + 0.4; // 0.4-0.8 range
    
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.opacity = opacity;
    
    // Simplified glow effect to reduce GPU load
    const glowSize = Math.random() * 1 + 0.5; // 0.5-1.5px range (reduced from 1.5-3.5px)
    particle.style.boxShadow = `0 0 ${glowSize}px var(--primary)`;
    
    return {
      element: particle,
      x,
      y,
      speed: Math.random() * 0.3 + 0.2, // Reduced speed factor
      opacity: opacity,
      size: size
    };
  }, []);

  useEffect(() => {
    const particlesContainer = particlesRef.current;
    if (!particlesContainer) return;

    // Optimized particle count for good performance
    const particleCount = 15;

    // Clear existing particles and array
    particlesContainer.innerHTML = '';
    particles.current = [];

    // Create and initialize particles
    for (let i = 0; i < particleCount; i++) {
      const particle = createParticle();
      const particleData = initializeParticle(particle);
      particles.current.push(particleData);
      particlesContainer.appendChild(particle);
    }

    // Cleanup function
    return () => {
      particles.current = [];
    };
  }, [createParticle, initializeParticle]);

  return <div className="floating-particles" ref={particlesRef}></div>;
};

export default FloatingParticles;
