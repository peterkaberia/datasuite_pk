inequalityUI <- function(id, i18n) {
  ns <- NS(id)
  
  tabPanelsUI(ns, i18n, 'title_national_inequality', downloadCoverageUI)
}

inequalityServer <- function(id, cache, admin_level, i18n) {
  stopifnot(is.reactive(cache))
  stopifnot(is.reactive(admin_level))

  moduleServer(
    id = id,
    module = function(input, output, session) {

      indicator <- indicatorSelectServer('indicator')

      inequalities <- reactive({
        req(cache(), cache()$check_inequality_params, admin_level())
        cache()$calculate_inequality(admin_level = admin_level())
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
    }
  )
}
