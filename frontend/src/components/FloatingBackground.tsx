import { useMemo } from "react";

const ALGO_PHRASES = [
  "min-cut-max-flow",
  "Minimum Spanning Tree (MST)",
  "O(V+E)",
  "Topological Sort",
  "Gscc",
  "Fast Fourier Transform (FFT)",
  "Dynamic Programming",
  "Dijkstra ",
  "Shortest Path",
  "Depth First Search (DFS)",
  "Graph Theory",
  "Sorting Algorithms",
  "The White Path",
  "Bellman-Ford",
  "A* Search",
  "Recursion",
];

const FloatingBackground = () => {
  const floatingElements = useMemo(() => {
    const textColors = [
      "text-indigo-400/30",
      "text-emerald-400/30",
      "text-rose-400/30",
      "text-sky-400/30",
      "text-amber-400/30",
    ];

    const textSizes = [
      "text-xs",
      "text-sm",
      "text-base",
      "text-lg",
      "text-2xl",
      "text-3xl font-extrabold",
    ];

    return ALGO_PHRASES.map((phrase, index) => {
      // פיזור רחב יותר כדי למנוע הצטברות במרכז
      const randomX = Math.floor(Math.random() * 90);
      const randomY = Math.floor(Math.random() * 90);

      // שימוש באנימציות השיוט החדשות
      const animations = [
        "animate-drift-slow",
        "animate-drift-medium",
        "animate-drift-fast",
      ];
      const randomAnimation = animations[index % animations.length];

      // טריק מקצועי: Delay שלילי גורם לאלמנט להתחיל באמצע האנימציה
      // במקום לחכות כשהעמוד נטען. זה מייצר פיזור ותנועה מיידית.
      const randomDelay = -(Math.random() * 50); // מספר אקראי בין 0 ל-50-

      const randomColor = textColors[index % textColors.length];
      const randomSize = textSizes[index % textSizes.length];

      return {
        id: index,
        text: phrase,
        x: randomX,
        y: randomY,
        animation: randomAnimation,
        delay: randomDelay,
        color: randomColor,
        size: randomSize,
      };
    });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-gray-950 bg-[radial-gradient(#111827_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-80">
      <div className="absolute inset-0 z-0 bg-gray-950 bg-gradient-to-br from-indigo-950/20 via-gray-950 to-emerald-950/20"></div>

      {floatingElements.map((el) => (
        <span
          key={el.id}
          className={`absolute font-mono font-semibold ${el.color} ${el.size} ${el.animation}`}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            animationDelay: `${el.delay}s`,
          }}
        >
          {el.text}
        </span>
      ))}
    </div>
  );
};

export default FloatingBackground;
