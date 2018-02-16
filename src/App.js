import React, { Component } from 'react';
import _ from 'lodash';
import './App.css';
import SidePanel from './SidePanel';
import SideMenu from './SideMenu';
import Notifications from './Notifications';
import Filters from './Notifications';

export default class App extends Component {

    constructor(props) {
        super(props);

        this._column     = 0;
        this._shift      = 0;
        this._velocity   = 0;
        this._lastMoveTs = 0;
        this._startTouch = null;
        this._prevTouch  = null;

        _.bindAll(this, [
            '_onTouchStart',
            '_onTouchEnd',
            '_onTouchMove',
            '_onSideMenuClick',
            '_onNotificationsClick',
            '_onFiltersClick',
        ]);
    }

    componentDidMount() {
        document.addEventListener('touchstart', this._onTouchStart);
    }

    render() {
        return (
            <div className="app">
                <div className="header">
                    <div className="header-part">
                        <div className="button" onClick={this._onSideMenuClick}>M</div>
                        <div className="button" onClick={this._onFiltersClick}>F</div>
                    </div>
                    <div className="header-part">
                        <div className="button"></div>
                        <div className="button" onClick={this._onNotificationsClick}>N</div>
                    </div>
                </div>
                <div className="board-wrapper" ref="boardWrapper">
                    <div className="board" ref="board">
                        <div className="column">
                            <div className="column-header">Идея</div>
                            <div className="task"></div>
                            <a href="//yandex.ru">
                                <div className="task"></div>
                            </a>
                            <div className="task"></div>
                            <div className="task"></div>
                            <div className="task"></div>
                            <div className="task"></div>
                            <div className="task"></div>
                            <div className="task"></div>
                            <div className="task"></div>
                        </div>
                        <div className="column">
                            <div className="column-header">План</div>
                            <div className="task"></div>
                            <div className="task"></div>
                        </div>
                        <div className="column">
                            <div className="column-header">В работе</div>
                            <div className="task"></div>
                            <div className="task"></div>
                            <div className="task"></div>
                        </div>
                        <div className="column">
                            <div className="column-header">Приёмка</div>
                            <div className="task"></div>
                            <div className="task"></div>
                        </div>
                        <div className="column">
                            <div className="column-header">Завершено</div>
                            <div className="task"></div>
                            <div className="task"></div>
                            <div className="task"></div>
                        </div>
                    </div>
                </div>
                <SidePanel ref="sideMenu">
                    <SideMenu />
                </SidePanel>
                <SidePanel ref="filters" style={{ width: '80%' }}>
                    <Filters />
                </SidePanel>
                <SidePanel ref="notifications" right style={{ width: '80%' }}>
                    <Notifications />
                </SidePanel>
            </div>
        );
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
        this._clear();

        if (this.refs.boardWrapper.contains(e.target) && e.touches.length === 1) {
            this._initialTouch = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };

            this._firstMove = true;

            this._width = this.refs.board.clientWidth / 100;

            document.addEventListener('touchmove', this._onTouchMove, {
                passive: false,
            });
            document.addEventListener('touchend', this._onTouchEnd, {
                passive: false,
            });

            //e.preventDefault();
        }
    }

    _onTouchMove(e) {
        console.log('move');

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

        this._setShift(-this._column * 100 + (touch.x - this._startTouch.x) / this._width);

        this._lastMoveTs = Date.now();
        this._prevTouch = touch;
    }

    _onTouchEnd(e) {
        if (!this._lastMoveTs) {
            return;
        }

        console.log('end');

        e.preventDefault();

        const startShift = this._shift;

        const n = -this._shift / 100;

        if (n < 0) {
            this._column = 0;
        } else if (n > 4) {
            this._column = 4;
        } else {
            const min = Math.floor(n);
            const max = Math.ceil(n);

            if (this._velocity > 0.5) {
                if (this._prevTouch.x < this._startTouch.x) {
                    this._column = max;
                } else {
                    this._column = min;
                }
            } else {
                if (-this._shift - min * 100 < 50) {
                    this._column = min;
                } else {
                    this._column = max;
                }
            }
        }

        const goingTo = -this._column * 100;

        const steps = Math.abs(this._shift - goingTo);

        let start  = null;
        let prevTs = null;

        const tick = ts => {
            if (!prevTs) {
                start  = ts;
                prevTs = ts;
                this._anim = requestAnimationFrame(tick);
                return;
            }

            const ease = 1 - Math.min(1, (ts - start) / (steps * 3));
            this._setShift(goingTo + (startShift - goingTo) * ease);

            if (ease > 0) {
                this._anim = requestAnimationFrame(tick);
            }
        };

        this._anim = requestAnimationFrame(tick);
    }

    _setShift(x) {
        this._shift = x;
        this.refs.board.style.transform = `translateX(${x}%)`;
    }

    _onNotificationsClick() {
        this.refs.notifications.show();
    }

    _onFiltersClick() {
        this.refs.filters.show();
    }

    _onSideMenuClick() {
        this.refs.sideMenu.show();
    }

}
