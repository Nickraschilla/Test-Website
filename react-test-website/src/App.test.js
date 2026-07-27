import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

let mockSocialsData;
let mockInstagramData;
let mockMetaAdsData;

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

jest.mock('./hooks/useMetaAdsData', () => ({
  useMetaAdsData: () => mockMetaAdsData || ({
    rows: [],
    loading: false,
    refreshing: false,
    error: '',
    usingFallback: false,
  }),
}));

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
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
  mockMetaAdsData = {
    rows: [
      {
        id: 'campaign-1',
        reportingStarts: '2026-07-01',
        reportingEnds: '2026-07-01',
        campaignId: 'cmp_meta_test',
        campaignName: 'Meta Test Campaign',
        campaignDelivery: 'Active',
        results: 12,
        resultIndicator: 'Meta leads',
        costPerResult: 10,
        amountSpent: 120,
        impressions: 1000,
        reach: 800,
        frequency: 1.25,
        lastSynced: '2026-07-27',
      },
      {
        id: 'campaign-1-previous',
        reportingStarts: '2026-06-15',
        reportingEnds: '2026-06-15',
        campaignId: 'cmp_meta_test',
        campaignName: 'Meta Test Campaign',
        campaignDelivery: 'Active',
        results: 6,
        resultIndicator: 'Meta leads',
        costPerResult: 10,
        amountSpent: 60,
        impressions: 500,
        reach: 400,
        frequency: 1.2,
      },
      {
        id: 'campaign-2',
        reportingStarts: '2026-07-02',
        reportingEnds: '2026-07-02',
        campaignId: 'cmp_second',
        campaignName: 'Second Meta Campaign',
        campaignDelivery: 'Ended',
        results: 3,
        resultIndicator: 'Meta leads',
        amountSpent: 90,
        impressions: 700,
        reach: 500,
        frequency: 1.4,
      },
    ],
    loading: false,
    refreshing: false,
    error: '',
    usingFallback: false,
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

test('opens the Meta Ads Reporting tab', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));

  expect(
    screen.getByRole('heading', { name: /meta ads reporting/i })
  ).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: /^campaign$/i })).toHaveValue('cmp_meta_test');
  expect(screen.getByText('Meta Test Campaign')).toBeInTheDocument();
  expect(screen.getByText(/15 June 2026 to 01 July 2026/i)).toBeInTheDocument();
  expect(screen.getByText(/daily performance/i)).toBeInTheDocument();
  expect(screen.getByText(/daily trend/i)).toBeInTheDocument();
  expect(screen.getByText(/campaign read/i)).toBeInTheDocument();
  expect(screen.getByText(/campaign vs other campaigns/i)).toBeInTheDocument();
  expect(screen.getByText('$180.00')).toBeInTheDocument();
  expect(screen.getAllByText('18').length).toBeGreaterThan(0);
  expect(screen.getByText(/18 from \$180\.00/i)).toBeInTheDocument();
  expect(screen.getByText(/12 on 01 July 2026/i)).toBeInTheDocument();
});

test('switches the selected Meta Ads campaign with the dropdown', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));
  fireEvent.change(screen.getByRole('combobox', { name: /^campaign$/i }), {
    target: { value: 'cmp_second' },
  });

  expect(screen.getByText('Second Meta Campaign')).toBeInTheDocument();
  expect(screen.getByText(/02 July 2026 to 02 July 2026/i)).toBeInTheDocument();
  expect(screen.getAllByText('$90.00').length).toBeGreaterThan(0);
  expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  expect(screen.getByText(/3 from \$90\.00/i)).toBeInTheDocument();
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
