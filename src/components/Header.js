import AppBar from "@material-ui/core/AppBar"
import Toolbar from "@material-ui/core/Toolbar"
import Typography from "@material-ui/core/Typography"

const Header = () => (

  <div
    className={"header"}
    style={{
      "position": "sticky",
      "top": 0
    }}
  >
    <header id="earthdata-tophat2" style={{ height: 0, top: 0 }}></header>
    <AppBar position="relative">
      <Toolbar>
        <a target="_blank" rel="noopener noreferrer" href="https://nasa.gov/">
          <img alt="NASA Logo" style={{ marginRight: 20, height: 50 }} src={`${process.env.PUBLIC_URL}/nasa_logo.png`} />
        </a>
        <a target="_blank" rel="noopener noreferrer" href="https://ghrc.nsstc.nasa.gov/">
          <img alt="GHRC Logo" style={{ marginRight: 20, height: 50 }} src={`${process.env.PUBLIC_URL}/ghrc_logo.png`} />
        </a>
        <img alt="FCX Logo" style={{ marginRight: 10, height: 50 }} src={`${process.env.PUBLIC_URL}/fcx_logo.png`} />

        <Typography variant="h6" noWrap>
          Field Campaign Explorer
        </Typography>

        <Typography variant="h6" style={{ marginLeft: 20 }}>
          <a target="_blank" rel="noopener noreferrer" style={{ color: "white", textDecoration: "none" }} href=" https://ghrc.nsstc.nasa.gov/home/feedback/contact">
            Contact
          </a>
        </Typography>
      </Toolbar>
    </AppBar>
  </div>
)

export default Header