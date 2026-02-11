import { PLACEHOLDER } from '../../utils/constants';

interface PlaceholderProps {
  className?: string;
}

export const Placeholder = ({ className = '' }: PlaceholderProps) => {
  return (
    <span className={`text-gray-400 ${className}`}>
      {PLACEHOLDER}
    </span>
  );
};

export default Placeholder;
