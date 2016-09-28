import classNames from 'classnames';
import events from 'add-event-listener';
import {EventEmitter} from 'fbemitter';
import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';

import addClass from '../../lib/dom/addClass';
import Center from '../Center';
import LayoutEvents from '../../lib/LayoutEvents';
import removeClass from '../../lib/dom/removeClass';
import RenderContainer from '../RenderContainer';
import stopPropagation from '../../lib/events/stopPropagation';
import Sticky from '../Sticky';

import styles from './Modal.less';

const stack = {
  emitter: new EventEmitter(),
  mounted: [],
};

let mountedModalsCount = 0;

/**
 * Модальное окно.
 */
class Modal extends React.Component {
  static propTypes = {
    /**
     * Не закрывать окно при клике на фон.
     */
    ignoreBackgroundClick: PropTypes.bool,

    /**
     * Не показывать крестик для закрытия окна.
     */
    noClose: PropTypes.bool,

    width: PropTypes.number,

    /**
     * Вызывается, когда пользователь запросил закрытие окна (нажал на фон, на
     * Escape или на крестик).
     */
    onClose: PropTypes.func,
  };

  static childContextTypes = {
    rt_inModal: PropTypes.bool,
  };

  state = {
    // Is shadowed by another modal that was rendered on top of this one.
    shadowed: false,
  };

  _stackSubscribtion = null;
  _centerDOM: ?HTMLElement = null;

  constructor(props, context) {
    super(props, context);

    stack.mounted.push(this);
    this._stackSubscribtion =
      stack.emitter.addListener('change', this._handleStackChange);
  }

  getChildContext() {
    return {rt_inModal: true};
  }

  render() {
    var close = null;
    if (!this.props.noClose) {
      close = (
        <a href="javascript:" className={styles.close}
          onClick={this._handleClose}
        >
          &times;
        </a>
      );
    }

    let hasHeader = false;
    const children = React.Children.map(this.props.children, child => {
      if (child && child.type === Header) {
        hasHeader = true;
        return React.cloneElement(child, {close});
      }
      return child;
    });

    const style = {};
    if (this.props.width) {
      style.width = this.props.width;
    }
    return (
      <RenderContainer containerClassName="rt_modal">
        <div className={styles.root}>
          {!this.state.shadowed && <div className={styles.bg} />}
          <Center
            ref={this._refCenter}
            className={styles.container}
            onClick={this._handleContainerClick}
          >
            <div className={styles.window} style={style}>
              {!hasHeader && close}
              {children}
            </div>
          </Center>
        </div>
      </RenderContainer>
    );
  }

  _refCenter = (center: ?Center) => {
    if (this._centerDOM) {
      events.removeEventListener(this._centerDOM, 'scroll', LayoutEvents.emit);
    }
    this._centerDOM = null;
    if (center) {
      const dom = ReactDOM.findDOMNode(center);
      this._centerDOM = dom;
      events.addEventListener(this._centerDOM, 'scroll', LayoutEvents.emit);
    }
  };

  componentDidMount() {
    events.addEventListener(document, 'keydown', this._handleNativeKey);

    if (mountedModalsCount === 0) {
      addClass(document.documentElement, styles.bodyClass);
      addClass(document.body, styles.bodyClass);
      LayoutEvents.emit();
    }
    mountedModalsCount++;

    stack.emitter.emit('change');
  }

  componentWillUnmount() {
    events.removeEventListener(document, 'keydown', this._handleNativeKey);

    if (--mountedModalsCount === 0) {
      removeClass(document.documentElement, styles.bodyClass);
      removeClass(document.body, styles.bodyClass);
      LayoutEvents.emit();
    }

    this._stackSubscribtion.remove();
    const inStackIndex = stack.mounted.findIndex(x => x === this);
    if (inStackIndex !== -1) {
      stack.mounted.splice(inStackIndex, 1);
    }
    stack.emitter.emit();
  }

  _handleStackChange = () => {
    const shadowed = stack.mounted[stack.mounted.length - 1] !== this;
    if (this.state.shadowed !== shadowed) {
      this.setState({shadowed});
    }
  };

  _handleContainerClick = (event) => {
    if (
      event.target === event.currentTarget &&
      !this.props.ignoreBackgroundClick
    ) {
      this._handleClose();
    }
  };

  _handleClose = () => {
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  _handleNativeKey = (nativeEvent) => {
    if (nativeEvent.keyCode === 27 && this.props.onClose) {
      stopPropagation(nativeEvent);
      this.props.onClose();
    }
  };
}

class Header extends React.Component {
  render() {
    return (
      <Sticky side="top">
        {fixed =>
          <div
            className={classNames(styles.header, fixed && styles.fixedHeader)}
          >
            {this.props.close &&
              <div className={styles.absoluteClose}>{this.props.close}</div>}
            {this.props.children}
          </div>
        }
      </Sticky>
    );
  }
}

class Body extends React.Component {
  static propTypes = {
    noPadding: PropTypes.bool,
  }
  
  render() {
    var names = classNames({
      [styles.body]: true,
      [styles.noPadding]: this.props.noPadding,
    });    
    
    return <div className={classNames(names)}>{this.props.children}</div>;
  }
}

class Footer extends React.Component {
  static propTypes = {
    panel: PropTypes.bool,
  }

  render() {
    var names = classNames({
      [styles.footer]: true,
      [styles.panel]: this.props.panel,
    });

    return (
      <Sticky side="bottom">
        {fixed =>
          <div className={classNames(names, fixed && styles.fixedFooter)}>
            {this.props.children}
          </div>
        }
      </Sticky>
    );
  }
}

Modal.Header = Header;
Modal.Body = Body;
Modal.Footer = Footer;

module.exports = Modal;
