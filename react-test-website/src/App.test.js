import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

let mockSocialsData;
let mockInstagramData;
let mockMetaAdsData;
let mockMetaAdsManualLeads;

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

jest.mock('./hooks/useMetaAdsManualLeads', () => ({
  useMetaAdsManualLeads: () => mockMetaAdsManualLeads || ({
    leads: [],
    loading: false,
    refreshing: false,
    error: '',
  }),
}));

beforeEach(() => {
  window.localStorage.clear();
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
        campaignId: 'cmp_active',
        campaignName: 'Meta Test Campaign',
        campaignDelivery: 'Active',
        campaignObjective: 'Leads',
        results: 12,
        resultIndicator: 'Meta leads',
        costPerResult: 10,
        amountSpent: 120,
        impressions: 1000,
        reach: 800,
      },
      {
        id: 'campaign-1-day-2',
        reportingStarts: '2026-07-02',
        reportingEnds: '2026-07-02',
        campaignId: 'cmp_active',
        campaignName: 'Meta Test Campaign',
        campaignDelivery: 'Active',
        campaignObjective: 'Leads',
        results: 6,
        resultIndicator: 'Meta leads',
        amountSpent: 60,
        impressions: 500,
        reach: 400,
      },
      {
        id: 'campaign-2',
        reportingStarts: '2026-07-03',
        reportingEnds: '2026-07-03',
        campaignId: 'cmp_ended',
        campaignName: 'Ended Meta Campaign',
        campaignDelivery: 'Ended',
        campaignObjective: 'Leads',
        results: 3,
        resultIndicator: 'Meta leads',
        amountSpent: 150,
        impressions: 800,
        reach: 500,
      },
    ],
    loading: false,
    refreshing: false,
    error: '',
    usingFallback: false,
  };
  mockMetaAdsManualLeads = {
    leads: [
      {
        id: 'lead-1',
        campaignId: 'cmp_active',
        name: 'Test Lead',
        position: 'President',
        club: 'Example FC',
        league: 'EDFL',
        contacted: true,
        converted: false,
        status: 'Contacted',
      },
      {
        id: 'lead-2',
        campaignId: 'cmp_ended',
        name: 'Other Lead',
        position: 'Coach',
        club: 'Other FC',
        league: 'VAFA',
        contacted: true,
        converted: true,
        status: 'Converted',
      },
      {
        id: 'lead-3',
        campaignId: 'different-sheet-id',
        campaignName: 'Meta Test Campaign',
        name: 'Name Match Lead',
        position: 'Coach',
        club: 'Name Match FC',
        league: 'EFNL',
        contacted: false,
        converted: false,
        status: 'New',
      },
    ],
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

test('opens the Meta Ads Reporting tab', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));

  expect(
    screen.getByRole('heading', { name: /meta ads reporting/i })
  ).toBeInTheDocument();
  expect(screen.getByText(/campaign review, lead quality and practical performance analysis/i)).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: /^campaign$/i })).toHaveValue('cmp_active');
  expect(screen.queryByText(/campaign score/i)).not.toBeInTheDocument();
  expect(screen.getByText(/performance over time/i)).toBeInTheDocument();
  expect(screen.getByText(/campaign comparison/i)).toBeInTheDocument();
  expect(screen.getByText(/lead pipeline/i)).toBeInTheDocument();
  expect(screen.getByText(/key takeaways/i)).toBeInTheDocument();
  expect(screen.getAllByText('$180.00').length).toBeGreaterThan(0);
  expect(screen.getAllByText('18').length).toBeGreaterThan(0);
});

test('switches Meta Ads campaign from the dropdown and comparison table', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));
  fireEvent.change(screen.getByRole('combobox', { name: /^campaign$/i }), {
    target: { value: 'cmp_ended' },
  });

  expect(screen.getByRole('combobox', { name: /^campaign$/i })).toHaveValue('cmp_ended');
  expect(screen.getAllByText('$150.00').length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole('cell', { name: 'Meta Test Campaign' }));

  expect(screen.getByRole('combobox', { name: /^campaign$/i })).toHaveValue('cmp_active');
});

test('shows lead pipeline rows from the lead sheet for the selected campaign', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /meta ads reporting paid campaigns/i }));

  expect(screen.getByText('Test Lead')).toBeInTheDocument();
  expect(screen.getByText('Name Match Lead')).toBeInTheDocument();
  expect(screen.getByText('President')).toBeInTheDocument();
  expect(screen.getByText('Example FC')).toBeInTheDocument();
  expect(screen.queryByText('Other Lead')).not.toBeInTheDocument();
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
