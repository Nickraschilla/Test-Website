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
  expect(screen.getByText(/campaign performance, lead generation and creative analysis/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /compare previous period/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/campaign review/i)).toHaveValue('cmp_meta_test');
});

test('selects a Meta Ads campaign row by mouse and preserves the date range', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));
  fireEvent.click(screen.getAllByText('Meta Test Campaign').find((node) => node.tagName === 'TD'));

  expect(screen.getByRole('button', { name: /back to campaigns/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /meta test campaign/i })).toBeInTheDocument();
  expect(screen.getAllByText(/03 June 2026 to 02 July 2026/i).length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText(/last synced 27 July 2026/i)).toBeInTheDocument();
});

test('changes the campaign review with the dropdown and updates URL state', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));
  fireEvent.change(screen.getByLabelText(/campaign review/i), {
    target: { value: 'cmp_second' },
  });

  expect(screen.getByRole('heading', { name: /second meta campaign/i })).toBeInTheDocument();
  expect(window.location.search).toContain('campaign=cmp_second');
});

test('uses a valid campaign query parameter selection', () => {
  window.history.replaceState(null, '', '/?campaign=cmp_second');

  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));

  expect(screen.getByLabelText(/campaign review/i)).toHaveValue('cmp_second');
});

test('falls back from an invalid campaign query parameter', () => {
  window.history.replaceState(null, '', '/?campaign=missing');

  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));

  expect(screen.getByLabelText(/campaign review/i)).toHaveValue('cmp_meta_test');
});

test('selects a Meta Ads campaign row by keyboard', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));
  const row = screen.getAllByText('Meta Test Campaign').find((node) => node.tagName === 'TD').closest('tr');

  fireEvent.keyDown(row, { key: 'Enter' });

  expect(screen.getByRole('button', { name: /back to campaigns/i })).toBeInTheDocument();
});

test('adds, edits and deletes a manual campaign lead', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));
  fireEvent.click(screen.getAllByText('Meta Test Campaign').find((node) => node.tagName === 'TD'));

  fireEvent.change(screen.getByPlaceholderText(/lead name/i), {
    target: { value: 'Sam Lead' },
  });
  fireEvent.change(screen.getByPlaceholderText(/short note/i), {
    target: { value: 'Follow up tomorrow' },
  });
  fireEvent.click(screen.getByRole('button', { name: /add lead/i }));

  expect(screen.getByText('Sam Lead')).toBeInTheDocument();
  expect(screen.getByText('Follow up tomorrow')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /edit/i }));
  fireEvent.change(screen.getByPlaceholderText(/lead name/i), {
    target: { value: 'Sam Updated' },
  });
  fireEvent.click(screen.getByRole('button', { name: /save lead/i }));

  expect(screen.getByText('Sam Updated')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /delete/i }));

  expect(screen.queryByText('Sam Updated')).not.toBeInTheDocument();
  expect(screen.getByText(/no manually entered leads/i)).toBeInTheDocument();
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
