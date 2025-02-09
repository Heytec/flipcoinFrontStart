// src/components/CoinFlip.js
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CoinFlip = ({ round }) => {
  const [flip, setFlip] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (round && round.outcome) {
      setResult(round.outcome);
      setFlip(true);
    }
  }, [round]);

  const coinVariants = {
    hidden: { rotateY: 0 },
    visible: { 
      rotateY: [0, 360, 720, 1080, 1440, 1800],
      transition: { duration: 2, ease: 'easeInOut' }
    }
  };

  return (
    <div className="mt-4 flex justify-center">
      <AnimatePresence>
        {flip && (
          <motion.div 
            className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-lg"
            variants={coinVariants}
            initial="hidden"
            animate="visible"
            onAnimationComplete={() => setFlip(false)}
          >
            <div className="text-3xl font-bold">
              {result === 'heads' ? 'H' : result === 'tails' ? 'T' : 'House'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoinFlip;

