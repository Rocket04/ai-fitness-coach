// Escape key handler for modal components
// Attach to document on mount, clean up on unmount

useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [isOpen, onClose]);

// For toggling modal state on repeat clicks:
const [showModal, setShowModal] = useState(false);
const [showSparklines, setShowSparklines] = useState(false);

const handleClick = () => {
  if (!showModal) {
    setShowModal(true);
  } else {
    setShowSparklines(o => !o);
  }
};