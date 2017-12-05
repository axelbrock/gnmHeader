import React, {Component} from 'react';

class MobileMegaNav extends Component {
  constructor(props) {
    super(props)
    this.state = {
      open: props.open
        ? true
        : false,
      items: []
    }

    this.toggleParent = props.toggle;
    this.subNavOpenInhibitor = false;
    this.subNavOpenTimer = null;
  }

  componentWillReceiveProps(nextProps) {
    /* it will not likely mount with the menu already */
    nextProps.items.forEach(i => {
      i.active = false;
    })
    this.setState({items: nextProps.items, open: nextProps.open})  }

  toggleSubMenu(i) {
    /* don't forget to close the others */
    this.setState((prevState) => {
      if (prevState.items[i].active) {
        prevState.items.map(item => {
          item.active = false
        })
      } else {
        prevState.items.map(item => {
          item.active = false
        });
        prevState.items[i].active = true;
      }
      return {items: prevState.items}
    })
  }

  toggleMenu = () => {
    this.toggleParent();
    this.setState(function(prevState) {
      return {
        open: !prevState.open
      }
    })
  }

  allClicks(e) {
    if (e.target.classList[0] == 'out-of-menu')
      this.toggleMenu();
    console.log(e.target.classList[0]);
  }

  render() {
    return (
      <div className={' gnm-mobile-mega-nav ' + (this.state.open
        ? 'active'
        : '')} onClick={this.allClicks.bind(this)}>
        <div className='container'>
          <div className='out-of-menu row '>
            <div className='col-lg-3 col-md-4 col-sm-3 col-xs-6 dark-background first-column'>
              <div className='row lift'>
                <div className='col-xs-12 search-container'>
                  <div className='input-group'>
                    <input type='text' className='form-control' placeholder='Search' />
                    <span className='input-group-btn' >
                      <button className='btn btn-default' type='button'>
                        <span className='glyphicon glyphicon-search' />
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              {this.state.items.map((navitem, i) => {
                return (
                  <div key={i} onClick={this.toggleSubMenu.bind(this, i)}>
                    <div className=' row lift'>
                      <div className={' exclusive-hover category col-xs-12 hover-color ' + (navitem.active
                        ? 'active'
                        : '')}>
                        <div className='row'>
                          <div className='col-xs-9 pointer'>
                            <span >{navitem.title}</span>
                          </div>
                          <div className='col-xs-3 pointer'>
                            <span className={' glyphicon glyphicon-chevron-right ' + (navitem.active
                              ? 'spun'
                              : '')} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {this.state.items.map((navitem, i) => {
                return (
                  <div key={i} className={' dark-background subcategory-page ' + (navitem.active
                    ? 'active '
                    : 'inactive')}>

                    <div className={'col-xs-12 inner-border'}>
                      <div className='row hover-color  category subcategory top-level-route'>
                        <a href='#'>
                          <div className='col-xs-12 tiny-padding-top '>
                            <span>{navitem.title + ' Home'}</span>
                          </div>
                        </a>
                      </div>
                      {navitem.subItems.map((subitem, j) => {
                        return (
                          <div key={j} className='row hover-color  category subcategory'>
                            <a href='#' onClick={this.toggleMenu}>
                              <div className='col-xs-12 tiny-padding-top'>
                                <span href='#'>{subitem.title}</span>
                              </div>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              })}
              <div className='subcategory-page dark-background ' />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default MobileMegaNav
