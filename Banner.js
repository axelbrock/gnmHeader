import React, {Component, PropTypes} from 'react';
import banners_fake from './Banner_Fake';
import UtilityBelt from './UtilityBelt';
import Ajax from './Ajax';

const hasLocalStorage = (function hasLocalStorage() {
  let uid = new Date();
  try {
    localStorage.setItem(uid, uid);
    localStorage.removeItem(uid);
    return true;
  } catch (e) {
    return false;
  }
})()

class Banner extends Component {
  constructor(props) {
    super(props)
    this.state = {
      active: false,
      alerts: [],
      collapsed: true,
      debug: false,
      schoolsClosed: false,
      schoolClosingUrl: '',
      live: false,
      notifications: 0
    }
    this.initTime = 0;
    this.affiliate = props.affiliate;
    this.cacheDuration = 60 * 1000;
    this.slideDelay = 10 * 1000;
    this.transitionSpeed = 600;
    this.bannerChecker = null;
    this.bannerSlider = null;
    this.UtilityBeltHeight = 30;
    this.serverSideRendered = false;
  }

  componentWillMount() {
    if (typeof window != 'object') {
      if (process.env.USER == 'don' || process.env.USER == 'ec2-user') {
      //  var BannerCache = require('../ServerCache/BannerCache.js')
        let alerts = BannerCache.get();
        this.updateAlerts(alerts);
      }
    } else {
      if (typeof window.gnmBannerCache != 'undefined') {
        this.serverSideRendered = true;
        this.updateAlerts(window.gnmBannerCache);
      }
    }
  }

  componentDidMount() {
    this.initTime = Date.now()
    if (this.state.debug)
      this.updateAlerts(banners_fake);
    else {
      if (!this.serverSideRendered)
        this.getDataIfNeeded();
      this.bannerChecker = setInterval(() => {
        this.getDataIfNeeded()
      }, this.cacheDuration);
    }
    this.bannerSlider = setInterval(() => {
      this.slideBanner()
    }, this.slideDelay);
    window.onresize = this.makeSpaceForHeader;
    this.makeSpaceForHeader()
  }

  getDataIfNeeded() {
    Ajax(`http://kotv.com/api/getBanners.aspx?station=${this.affiliate}&IsWeb=true`).then((res) => {
      this.updateAlerts(JSON.parse(res))
    })
  }

  updateAlerts(alerts) {
    let schoolsClosed = false;
    let schoolClosingUrl = '';
    let live = false;
    alerts.map((a, i) => {
      if (a.BannerTypeId == 1) {
        schoolsClosed = true;
        schoolClosingUrl = a.Link;
      }
      if (a.BannerTypeId == 5) {
        live = true;
      }
    })
    alerts = alerts.filter(function(a) {
      return a.BannerTypeId != 1 //remove the school closings banner
    })
    alerts.map((a, i) => {
      a.activeOrder = i;
    })
    this.setState({
      alerts: alerts,
      active: alerts.length > 0
        ? true
        : false,
      schoolsClosed: schoolsClosed,
      schoolClosingUrl: schoolClosingUrl,
      live: live
    })
  }

  slideBanner() {
    if (!this.state.collapsed)
      return null
    this.setState(function(prevState) {
      if (prevState.alerts.length == 0)
        return
      let newalerts = prevState.alerts.map((el, i, array) => {
        el.activeOrder = el.activeOrder != 0
          ? el.activeOrder - 1
          : array.length - 1;
        return el
      })
      return {alerts: newalerts}
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.active != prevState.active || this.state.collapsed != prevState.collapsed)
      this.makeSpaceForHeader();
    }

  componentWillUnmount() {
    clearInterval(this.bannerChecker);
    clearInterval(this.bannerSlider);
    this.makeSpaceForHeader();
  }

  makeSpaceForHeader = () => {
    /* css transition for this effect can be found both in Banner.css and global.css */
    var banner_height = this.state.active
      ? (this.state.collapsed
        ? 40
        : this.state.alerts.length * 40)
      : 0;

    var headerHeight = 101;
    if (typeof document.getElementById('gnm-header-without-banner') == 'object') {
      headerHeight = document.getElementById('gnm-header-without-banner').offsetHeight;
    }
    let new_padding = (headerHeight + banner_height + this.UtilityBeltHeight + 8) + 'px';
    /* really hate touching the DOM, but I don't see any way out of this */
    if (document.getElementById('gnm-main-body'))
      document.getElementById('gnm-main-body').style.paddingTop = new_padding;
    /* for frankly layout only */
    if (document.querySelector('.PageGrid.PageBody.container'))
      document.querySelector('.PageGrid.PageBody.container').style.paddingTop = new_padding;
    }

  toggleCollapsed() {
    this.setState((prevState) => {
      return {
        collapsed: !prevState.collapsed
      }
    })
  }

  animatedStyle = (a, i) => {
    if (this.state.collapsed) {
      if (this.state.alerts.length == 1) {
        return {};
      }
      let transformPercent = 0;
      let zIndex = '-1'
      if (a.activeOrder == this.state.alerts.length - 1) {
        transformPercent = 100;
        zIndex = '1';
      }
      if (a.activeOrder == 0) {
        zIndex = '1';
      }
      return {
        zIndex: (this.state.alerts.length - a.activeOrder).toString(),
        transition: 'z-index ' + 6 *this.transitionSpeed + 'ms linear,  transform ' + this.transitionSpeed + 'ms ease-in-out',
        transform: 'translate3d(0,' + transformPercent + '%,0)'
      }
    } else {
      return {
        opacity: '1',
        zIndex: (this.state.alerts.length - a.activeOrder).toString(),
        transition: 'z-index 0ms, transform ' + this.transitionSpeed + 'ms ease-in-out',
        transform: 'translate3d(0,' + 100 *a.activeOrder + '%,0)'
      }
    }
  }

  animatedClass = (a, i) => {
    if (this.state.collapsed == true)
      return 'alert-red';

    if (a.activeOrder % 2 == 1)
      return 'alert-dark-red';
    return 'alert-red';
  }

  wrapperStyle() {
    if (this.state.collapsed) {
      if (this.state.active > 0)
        return {
          height: 40 + this.UtilityBeltHeight + 'px'
        }
      else
        return {
          height: this.UtilityBeltHeight + 'px'
        }
      } else
      return {
        height: this.state.alerts.length*40 + this.UtilityBeltHeight + 'px'
      }
  }

  render() {
    return (
      <div className={'gnm-banner '}>
        <div className='gnm-banner-control' style={this.wrapperStyle()}>
          <div className='container '>
            <button className='show-all' onClick={this.toggleCollapsed.bind(this)} style={{
              display: this.state.alerts.length > 1
                ? 'block'
                : 'none'
            }}>
              <span className={'glyphicon glyphicon-chevron-up' + (this.state.collapsed
                ? ' collapsed'
                : '')} />
            </button>
            <div className='alert-container'>

              {this.state.alerts.map((a, i) => {
                return (
                  <div key={i} className={'item '} style={this.animatedStyle(a, i)} role='option'>
                    <div className={'alert ' + this.animatedClass(a, i) + (a.activeOrder == 0
                      ? ' active'
                      : '')} role='alert'>
                      <div className='line-clamp '>
                        <a href={a.Link}>
                          <span className=''>{a.Title}:
                          </span>
                          <span>{' ' + a.Description}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })
            }
            </div>
          </div>
        </div>
        <UtilityBelt affliate='kotv' schoolsClosed={this.state.schoolsClosed} schoolClosingUrl={this.state.schoolClosingUrl} live={this.state.live} style={{
          height: this.UtilityBeltHeight + 'px'
        }} />
      </div>

    )
  }
}

export default Banner;
