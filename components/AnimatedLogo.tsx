import React, { useState, useEffect } from 'react';

const AnimatedLogo: React.FC = () => {
    const [animate, setAnimate] = useState(true);
    useEffect(() => {
      const interval = setInterval(() => {
        setAnimate(false);
        setTimeout(() => setAnimate(true), 50);
      }, 5000);
      return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-shrink-0 flex items-center cursor-pointer gap-1">
            <img 
              src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHV4ZmVyb3BuNDRqZTh3cmZhdnFzajhtYzVxbmtpbndycGZncnFoayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/A6wzZDYl66nNU6ZCCq/giphy.gif"
              alt="animated character" 
              className="w-7 h-7 animate-logo-gif"
            />
            <span className="text-xl font-bold">
                <span className="text-orange-500 font-quicksand tracking-wide">PPKC</span>
                <span className="text-brand-logo-blue font-orbitron">
                  202
                  {animate ? (
                     <span className="inline-block animate-logo-5">5</span>
                  ) : (
                     <span className="inline-block">5</span>
                  )}
                </span>
            </span>
        </div>
    );
};

export default AnimatedLogo;
