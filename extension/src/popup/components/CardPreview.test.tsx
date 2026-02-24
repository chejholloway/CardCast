import { render, screen } from '@testing-library/react';
import { CardPreview } from './CardPreview';

const mockProps = {
  title: 'Test Title',
  description: 'Test Description',
  imageUrl: 'https://example.com/image.png',
  url: 'https://example.com/article',
};

describe('CardPreview', () => {
  it('should render the title, description, and image', () => {
    render(<CardPreview {...mockProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/image.png'
    );
  });

  it('should extract and display the domain from the url', () => {
    render(<CardPreview {...mockProps} />);
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });
});
