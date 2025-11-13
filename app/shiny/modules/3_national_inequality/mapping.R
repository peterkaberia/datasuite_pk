subnationalMappingUI <- function(id, i18n) {
  ns <- NS(id)
  
  tabPanelsUI(ns, i18n, 'title_subnational_mapping', downloadCoverageUI)
}

subnationalMappingServer <- function(id, cache, palette, i18n) {
  stopifnot(is.reactive(cache))
  stopifnot(is.reactive(palette))

  moduleServer(
    id = id,
    module = function(input, output, session) {

      indicator <- indicatorSelectServer('indicator')

      mapping_dt <- reactive({
        req(cache(), cache()$check_inequality_params)
        cache()$get_mapping_data('adminlevel_1')
      })

      years <- reactive({
        req(cache())
        cache()$mapping_years
      })
      
      tabPanelsServer(
        ns,
        serverInput = function(ns, id, indicator) {
          denom_rx <- reactive(cache()$get_denominator(indicator))
          data_rx <- reactive({ 
            req(mapping_dt(), palette())
            mapping_dt() %>%
              filter_mapping_data('penta3', denominator = denom_rx(), palette = palette(), plot_year = years())
          })
          
          downloadCoverageServer(
            id = id, # or just ind if inside the same module id
            filename = reactive(paste0(indicator, '_adminlevel_1_map_', denom_rx())),
            data_fn = data_rx,
            sheet_name = reactive(i18n$t(paste0("opt_", indicator))),
            i18n = i18n
          )
        }
      )
    }
  )
}
