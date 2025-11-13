indicators <- c('penta1', 'penta3', 'measles1', 'dropout_penta13', 'dropout_penta3mcv1')

nationalCoverageUI <- function(id, i18n) {
  ns <- NS(id)

  countdownDashboard(
    dashboardId = ns('national_coverage'),
    dashboardTitle = i18n$t('title_national_coverage'),
    i18n = i18n,

    countdownOptions(
      title = i18n$t('title_options'),
      column(3, denominatorInputUI(ns('denominator'), i18n))
    ),
    
    tabPanelsUI(ns, i18n, 'title_national_coverage', downloadCoverageUI)
  )
}

nationalCoverageServer <- function(id, cache, i18n) {
  stopifnot(is.reactive(cache))

  moduleServer(
    id = id,
    module = function(input, output, session) {
      ns <- session$ns

      indicator <- indicatorSelectServer('indicator')
      denominatorInputServer('denominator', cache, i18n)

      coverage <- reactive({
        req(cache(), cache()$check_coverage_params)
        cache()$calculate_coverage('national')
      })
      
      tabPanelsServer(
        ns,
        serverInput = function(ns, id, indicator) {
          denom_rx <- reactive(cache()$get_denominator(indicator))
          data_rx <- reactive({ 
            req(coverage())
            coverage() %>% filter_coverage(indicator, denominator = denom_rx()) 
          })
          
          downloadCoverageServer(
            id = id, # or just ind if inside the same module id
            filename = reactive(paste0(indicator, "_survey_", denom_rx())),
            data_fn = data_rx,
            sheet_name = reactive(i18n$t(paste0("opt_", indicator))),
            i18n = i18n
          )
        }
      )

      countdownHeaderServer(
        'national_coverage',
        cache = cache,
        path = 'national-coverage',
        i18n = i18n
      )
    }
  )
}
