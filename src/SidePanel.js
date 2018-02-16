import React, { Component } from 'react';
import cn from 'classnames';
import _ from 'lodash';
import './SidePanel.css';

export default class Notifications extends Component {

    constructor(props) {
        super(props);

        this.state = {
            show:   false,
            rising: false,
            manual: false,
            hiding: false,
        };

        _.bindAll(this, [
            '_onBgClick',
            '_onTouchStart',
            '_onTouchEnd',
            '_onTouchMove',
        ]);
    }

    componentDidMount() {
        document.addEventListener('touchstart', this._onTouchStart);
    }

    render() {
        const { right } = this.props;
        const { show, rising, manual, hiding } = this.state;

        if (!show) {
            return null;
        }

        const styles = {};

        if (right) {
            styles.right = 0;
        } else {
            styles.left = 0;
        }

        Object.assign(styles, this.props.style);

        return (
            <div className={cn('side-panel', {
                'side-panel_left':      !this.props.right,
                'side-panel_right':     this.props.right,
                'side-panel_rising':    rising,
                'side-panel_hiding':    hiding,
                'side-panel_move-back': hiding && !manual,
            })} ref="root" onTouchStart={this._onBgClick}>
                <div className="side-panel__panel" ref="panel" style={styles}>
                    {this.props.children}
                </div>
            </div>
        );
    }

    show() {
        this._shift = 0;

        this.setState({
            show:   true,
            rising: true,
            manual: false,
        });

        setTimeout(() => {
            this.setState({
                rising: false,
            });
        }, 300);
    }

    _onBgClick(e) {
        if (e.target === this.refs.root && !this.state.hiding) {
            this._close();
        }
    }

    _clear() {
        this._startTouch = null;
        this._prevTouch  = null;
        this._lastMoveTs = 0;
        this._velocity   = 0;

        cancelAnimationFrame(this._anim);
        document.removeEventListener('touchmove', this._onTouchMove);
        document.removeEventListener('touchend', this._onTouchEnd);
    }

    _onTouchStart(e) {
        if (!this.state.show) {
            return;
        }

        this._clear();

        if (this.refs.panel.contains(e.target) && e.touches.length === 1) {
            this._initialTouch = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };

            this._firstMove = true;

            this._width = this.refs.panel.clientWidth / 100;

            document.addEventListener('touchmove', this._onTouchMove, {
                passive: false,
            });
            document.addEventListener('touchend', this._onTouchEnd, {
                passive: false,
            });
        }
    }

    _onTouchMove(e) {
        const touch = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        };

        if (this._firstMove) {
            this._firstMove = false;
            const deltaX = Math.abs(this._initialTouch.x - touch.x);
            const deltaY = Math.abs(this._initialTouch.y - touch.y);

            if (deltaX < deltaY) {
                this._clear();
                return;
            }

            this._startTouch = touch;
            this._prevTouch  = touch;
            this._lastMoveTs = Date.now();
            e.preventDefault();
            return;
        }

        e.preventDefault();

        this._velocity = Math.abs((this._prevTouch.x - touch.x) / (Date.now() - this._lastMoveTs));

        this._setShift((touch.x - this._startTouch.x) / this._width);

        this._lastMoveTs = Date.now();
        this._prevTouch = touch;
    }

    _onTouchEnd(e) {
        if (!this._lastMoveTs) {
            return;
        }

        e.preventDefault();

        const { right } = this.props;

        const startShift = this._shift;

        let close = false;

        if (this._velocity > 0.5) {
            close = this._prevTouch.x < this._startTouch.x;

            if (right) {
                close = !close;
            }
        } else {
            if (right) {
                close = this._shift > 20;
            } else {
                close = this._shift < -20;
            }
        }

        const goingTo = close ? (right ? 100 : -100) : 0;

        const ratio = 180 * (Math.abs(this._shift - goingTo) / 100);

        let start  = null;
        let prevTs = null;

        const tick = ts => {
            if (!prevTs) {
                start  = ts;
                prevTs = ts;
                this._anim = requestAnimationFrame(tick);
                return;
            }

            const ease = 1 - Math.min(1, (ts - start) / ratio);
            this._setShift(goingTo + (startShift - goingTo) * ease);

            if (ease > 0) {
                this._anim = requestAnimationFrame(tick);
            } else {
                this._clear();
            }
        };

        this._anim = requestAnimationFrame(tick);

        if (close) {
            this._close(true);
        }
    }

    _setShift(x) {
        if (this.props.right) {
            this._shift = Math.max(0, x);
        } else {
            this._shift = Math.min(0, x);
        }

        this.refs.panel.style.transform = `translateX(${this._shift}%)`;
    }

    _close(isSwipe) {
        this.setState({
            manual: isSwipe,
            hiding: true,
        });

        setTimeout(() => {
            this.setState({
                manual: false,
                hiding: false,
                show:   false,
            });
        }, 200);
    }

}
