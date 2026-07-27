import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

let mockSocialsData;
let mockInstagramData;

jest.mock('./hooks/useReelsData', () => ({
  useReelsData: () => mockSocialsData || ({
    reels: [],
    loading: false,
    refreshing: false,
    error: '',
  }),
  useInstagramData: () => mockInstagramData || ({
    reels: [],
    loading: false,
    refreshing: false,
    error: '',
  }),
}));

beforeEach(() => {
  mockSocialsData = {
    reels: [],
    loading: false,
    refreshing: false,
    error: '',
  };
  mockInstagramData = {
    reels: [],
    loading: false,
    refreshing: false,
    error: '',
  };
});

test('renders the reporting dashboard tabs', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: /instagram reporting/i })
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /socials reporting leaderboard/i }));

  expect(
    screen.getByText(/board totals/i)
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: /live leaderboard/i })
  ).toBeInTheDocument();

  expect(screen.queryByRole('button', { name: 'Total' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Facebook' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );

  fireEvent.click(screen.getByRole('button', { name: 'Facebook' }));

  expect(screen.getByRole('button', { name: 'Facebook' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  fireEvent.click(screen.getByRole('button', { name: 'Instagram' }));

  expect(screen.getByRole('button', { name: 'Facebook' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Instagram' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('uses Instagram loading state for the default page', () => {
  mockSocialsData.loading = false;
  mockInstagramData.loading = true;

  render(<App />);

  expect(screen.getByRole('status')).toHaveTextContent(/syncing live data/i);
});

test('shows only the active tab error message', () => {
  mockSocialsData.error = 'Could not load Socials Reporting data.';
  mockInstagramData.error = '';

  render(<App />);

  expect(screen.queryByRole('alert')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /socials reporting leaderboard/i }));

  expect(screen.getByRole('alert')).toHaveTextContent(/could not load socials reporting data/i);
});
