import { motion } from 'framer-motion';

const Card = ({ children, className = '', hover = false, ...props }) => (
  <motion.div
    whileHover={hover ? { y: -4, scale: 1.01 } : {}}
    className={`glass rounded-2xl p-6 ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);

export default Card;
