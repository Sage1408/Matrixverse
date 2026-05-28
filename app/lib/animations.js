export const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export const fadeInUpFast = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

export const staggerContainerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

export const slideDown = {
  hidden: { y: -100 },
  visible: { y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export const parallax = (distance = 100) => ({
  hidden: { y: 0 },
  visible: { y: 0, transition: { duration: 0 } },
});

export const float = {
  initial: { y: 0 },
  animate: {
    y: [-20, 20, -20],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
  },
};

export const floatSlow = {
  initial: { y: 0 },
  animate: {
    y: [-15, 15, -15],
    transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
  },
};

export const floatReverse = {
  initial: { y: 0 },
  animate: {
    y: [20, -20, 20],
    transition: { duration: 7, repeat: Infinity, ease: "easeInOut" },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

export const rotate3d = {
  hidden: { opacity: 0, rotateX: 15, y: 40 },
  visible: { opacity: 1, rotateX: 0, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};
