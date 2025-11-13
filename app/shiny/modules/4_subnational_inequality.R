subnationalInequalityUI <- function(id, i18n) {
  ns <- NS(id)

  countdownDashboard(
    dashboardId = ns('subnational_inequality'),
    dashboardTitle = i18n$t('title_subnational_inequality'),
    i18n = i18n,

    countdownOptions(
      title = i18n$t('title_options'),
      column(3, denominatorInputUI(ns('denominator'), i18n)),
      column(3, regionInputUI(ns('region'), i18n))
    ),
    
    tabPanelsUI(ns, i18n, 'title_subnational_inequality', downloadCoverageUI)
  )
}

subnationalInequalityServer <- function(id, cache, i18n) {
  stopifnot(is.reactive(cache))

  moduleServer(
    id = id,
    module = function(input, output, session) {

      denominatorInputServer('denominator', cache, i18n)
      region <- regionInputServer('region', cache, reactive('adminlevel_1'), i18n)
      indicator <- indicatorSelectServer('indicator')

      inequalities <- reactive({
        req(cache(), cache()$check_inequality_params, region())
        cache()$calculate_inequality(admin_level = 'adminlevel_1', region = region())
      })
      
      tabPanelsServer(
        ns,
        serverInput = function(ns, id, indicator) {
          denom_rx <- reactive(cache()$get_denominator(indicator))
          data_rx <- reactive({ 
            req(inequalities())
            inequalities() %>%  filter_inequality(indicator = indicator, denominator = denom_rx())
          })
          
          downloadCoverageServer(
            id = id, # or just ind if inside the same module id
            filename = reactive(paste0(indicator, '_', admin_level(), '_inequality_', denom_rx())),
            data_fn = data_rx,
            sheet_name = reactive(i18n$t(paste0("opt_", indicator))),
            i18n = i18n
          )
        }
      )

      countdownHeaderServer(
        'subnational_inequality',
        cache = cache,
        path = 'subnational-inequality',
        i18n = i18n
      )
    }
  )
}
