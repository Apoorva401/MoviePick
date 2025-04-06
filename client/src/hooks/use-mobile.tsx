import * as React from "react"

const MOBILE_BREAKPOINT = 768

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [isMounted, setIsMounted] = React.useState<boolean>(false)

  React.useEffect(() => {
    setIsMounted(true)
    
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      const onChange = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
      
      // Use the appropriate method depending on browser support
      if (mql.addEventListener) {
        mql.addEventListener("change", onChange)
      } else if (mql.addListener) {
        // For older browsers
        mql.addListener(onChange)
      }
      
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      
      return () => {
        if (mql.removeEventListener) {
          mql.removeEventListener("change", onChange)
        } else if (mql.removeListener) {
          // For older browsers
          mql.removeListener(onChange)
        }
      }
    }
  }, [])

  // Return false if not mounted yet (for SSR)
  return isMounted ? isMobile : false
}

export default useIsMobile;
