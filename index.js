import React, {Component} from 'react';
import Banner from './Banner';
import MobileMegaNav from './MobileMegaNav';
import CurrentConditions from './CurrentConditions';
import TempNav from './TempNav';

class Header extends Component {
  constructor(props) {
    super(props);
    this.stationID = props.affiliate === 'kwtv'
      ? 2
      : 1; //Dont beleive this has been set yet
    this.affiliate = props.affiliate;
    this.stackedLogoUrl = props.affiliate == 'kotv'
      ? 'img/n6-stacked-logo.svg'
      : 'img/n9-stacked-logo.svg';
    this.otsLogoUrl = props.affiliate == 'kotv'
      ? 'img/n6logo.svg'
      : 'img/n6logo.svg';
    this.navigation_data = props.cache;
    this.state = {
      largeLogoUrl: 'http://ftpcontent.worldnow.com/kotv/test/don/build/img/bug.svg',
      smallLogoUrl: 'http://ftpcontent.worldnow.com/kotv/test/don/build/img/n6logo.svg',
      radarImg: `http://aws.kotv.com/MorHtml5/kotv/ssite/110x62_new/main_anim.gif?${ (new Date()).getTime()}`,
      navItems: [],
      megaNavItems: [],
      mobileMegaNavItems: [],
      mobileMegaNavOpen: false,
      city: '',
      state: '',
      conditionIcon: '',
      temp: '',
      feelsLike: '',
      high: '',
      low: '',
      currentConditions: [],
      currentsConditionsTime: Date.now()
    }
  }

  componentDidMount() {
    if (typeof window == 'object') {
      this.buildState(TempNav)
    }
  }

  componentWillMount() {
    if (typeof window != 'object')
      if (process.env.HOME == '/Users/don') {
        /* problem here we can't run this on Frankly servers */
      //  var NavigationCache = require('../ServerCache/NavigationCache.js')
        this.buildState(NavigationCache.get()); //sorry
      }
    }

  buildState(navs) {
    let navItems = [];
    let megaNavItems = [];
    let mobileMegaNavItems = [];
    navs.map(function(item, i) {
      if (typeof item.subItems !== 'undefined' && item.title !== 'About Us' && item.title !== 'Video' && item.title != 'Contests' && item.title !== 'Home') {
        megaNavItems.push(item);
      }
      if (typeof item.subItems !== 'undefined' && item.title !== 'Home')
        mobileMegaNavItems.push(item);

      if (item.title !== 'About Us' && item.title !== 'Home') {
        navItems.push(item);
      }
    });
    this.setState({navItems: navItems, megaNavItems: megaNavItems, mobileMegaNavItems: mobileMegaNavItems});
  }

  toggleMobileMegaNav = () => {
    this.setState({
      mobileMegaNavOpen: !this.state.mobileMegaNavOpen
    })
  }

  render() {
    return (
      <div className='gnm-header'>
      <h1>sup</h1>
        <Banner affiliate={this.affiliate} />
        <div id='gnm-header-without-banner'>
          <div className='container'>
            <div className='pull-left'>
              <button onClick={this.toggleMobileMegaNav} className={'dark-icon-bar-container ' + (this.state.mobileMegaNavOpen
                ? 'active'
                : '')}>
                <div className='dark-icon-bar' />
                <div className='dark-icon-bar' />
                <div className='dark-icon-bar' />
              </button>
            </div>
            <div className='pull-left visible-lg-block visible-md-block'>
              <img src={this.stackedLogoUrl} className='logo-stacked' />
            </div>
            <div className='pull-left visible-xs-block visible-sm-block'>
              <img src={this.otsLogoUrl} className='logo-ots' />
            </div>
            <div className='pull-left visible-lg-block'>
              <img className='ad768' src='img/ad728x90.jpg' />
            </div>
            <div className='pull-left visible-md-block'>
              <img className='ad640' src='img/ad-md-640x100.jpg' />
            </div>
            <div className='pull-left visible-sm-block'>
              <img className='ad320' src='img/ad-md-640x100.jpg' />
            </div>
            <div className='pull-right'>
              <CurrentConditions affiliate={this.affiliate} />
            </div>
          </div>
        </div>
        <MobileMegaNav items={this.state.mobileMegaNavItems} open={this.state.mobileMegaNavOpen} toggle={this.toggleMobileMegaNav} />
      </div>
    );
  }
}

export default Header;
