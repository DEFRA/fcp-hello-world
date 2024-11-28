import {
  endOfDay,
  format,
  formatDuration,
  intervalToDuration,
  startOfDay,
  subDays
} from 'date-fns'

export default class DashboardController {
  routes = [
    {
      method: 'GET',
      path: '/',
      handler: this.viewDashboard.bind(this)
    }
  ]

  constructor({ dashboardService }) {
    this.dashboardService = dashboardService
  }

  async viewDashboard(request, h) {
    const { start, end } = request.query

    const range =
      start && end
        ? {
            start: startOfDay(start),
            end: endOfDay(end)
          }
        : {
            start: startOfDay(subDays(new Date(), 31)),
            end: endOfDay(new Date())
          }

    const data = await this.dashboardService.getDashboardData(range)

    return h.view('dashboard/index', {
      nav: { dashboardActive: true },
      range: {
        start: format(range.start, 'yyyy-MM-dd'),
        end: format(range.end, 'yyyy-MM-dd')
      },
      cases: {
        countByStatus: data.cases.countByStatus,
        avgTimeToResolve:
          formatDuration(
            intervalToDuration({
              start: 0,
              end: data.cases.avgTimeToResolveInMs
            }),
            {
              format: ['days', 'hours', 'minutes', 'seconds'],
              zero: true,
              locale: {
                formatDistance: (token, count) =>
                  ({
                    xSeconds: '{{count}}s',
                    xMinutes: '{{count}}min',
                    xHours: '{{count}}h',
                    xDays: '{{count}}d'
                  })[token].replace('{{count}}', count)
              }
            }
          ) || 0
      },
      grants: {
        active: data.grants.active,
        total: data.grants.totalPotValue.toLocaleString('en-GB', {
          style: 'currency',
          currency: 'GBP',
          notation: 'compact'
        }),
        toPay: data.grants.toPay
          ? data.grants.toPay.toLocaleString('en-GB', {
              style: 'currency',
              currency: 'GBP',
              notation: 'compact'
            })
          : 0
      }
    })
  }
}
