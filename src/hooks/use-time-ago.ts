
"use client";

import { useState, useEffect } from "react";

export function useTimeAgo(date: Date) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const update = () => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        setTimeAgo(`${hours}h`);
      } else {
        setTimeAgo(`${Math.max(1, minutes)}m`);
      }
    };

    // Run the first update on the client side after mount
    update();
    
    const interval = setInterval(update, 60000); // update every minute
    return () => clearInterval(interval);
  }, [date]);

  return timeAgo;
}
