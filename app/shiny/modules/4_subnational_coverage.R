subnationalCoverageUI <- function(id, i18n) {
  ns <- NS(id)

  countdownDashboard(
    dashboardId = ns('subnational_coverage'),
    dashboardTitle = i18n$t('title_subnational_coverage'),
    i18n = i18n,

    countdownOptions(
      title = i18n$t('title_options'),
      column(3, denominatorInputUI(ns('denominator'), i18n)),
      column(3, adminLevelInputUI(ns('admin_level'), i18n)),
      column(3, regionInputUI(ns('region'), i18n))
    ),
    
    tabPanelsUI(ns, i18n, 'title_subnational_coverage', downloadCoverageUI)
  )
}

subnationalCoverageServer <- function(id, cache, i18n) {
  stopifnot(is.reactive(cache))

  moduleServer(
    id = id,
    module = function(input, output, session) {
      ns <- session$ns

      admin_level <- adminLevelInputServer('admin_level')
      denominatorInputServer('denominator', cache, i18n)
      region <- regionInputServer('region', cache, admin_level, i18n)

      coverage <- reactive({
        req(cache(), cache()$check_coverage_params, admin_level())
        cache()$calculate_coverage(admin_level())
      })
      
      tabPanelsServer(
        ns,
        serverInput = function(ns, id, indicator) {
          denom_rx <- reactive(cache()$get_denominator(indicator))
          data_rx <- reactive({ 
            req(coverage(), region())
            coverage() %>% filter_coverage(indicator, denominator = denom_rx(), region = region()) 
          })
          
          downloadCoverageServer(
            id = id, # or just ind if inside the same module id
            filename = reactive(paste0(indicator, '_', region(), "_survey_", denom_rx())),
            data_fn = data_rx,
            sheet_name = reactive(i18n$t(paste0("opt_", indicator))),
            i18n = i18n
          )
        }
      )

      countdownHeaderServer(
        'subnational_coverage',
        cache = cache,
        path = 'subnational-coverage',
        i18n = i18n
      )
    }
  )
}
