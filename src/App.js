import React, { Component } from 'react';
import cn from 'classnames';
import _ from 'lodash';
import './App.css';
import SidePanel from './SidePanel';
import SideMenu from './SideMenu';
import Notifications from './Notifications';
import Filters from './Filters';

const COLUMNS = [
    'Идея',
    'План',
    'В работе',
    'Приём',
    'Завершено',
];

export default class App extends Component {

    constructor(props) {
        super(props);

        this._shift      = 0;
        this._velocity   = 0;
        this._lastMoveTs = 0;
        this._startTouch = null;
        this._prevTouch  = null;

        this.state = {
            column:  0,
            inSwipe: false,
        };

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
        const { column, inSwipe } = this.state;

        return (
            <div className="app">
                <div className="header">
                    <div className={cn('header__column-name', {
                        'header__column-name_in-swipe': inSwipe,
                    })}>
                        {COLUMNS[column]}
                    </div>
                    <div className="header__buttons">
                        <div className="header-part">
                            <div className="button" onClick={this._onSideMenuClick}>M</div>
                            <div className="button" onClick={this._onFiltersClick}>F</div>
                        </div>
                        <div className="header-part">
                            <div className="button"></div>
                            <div className="button" onClick={this._onNotificationsClick}>N</div>
                        </div>
                    </div>
                </div>
                <div className="board-wrapper" ref="boardWrapper">
                    <div className="board" ref="board">
                        <div className="column">
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
                            <div className="task"></div>
                            <div className="task"></div>
                        </div>
                        <div className="column">
                            <div className="task"></div>
                            <div className="task"></div>
                            <div className="task"></div>
                        </div>
                        <div className="column">
                            <div className="task"></div>
                            <div className="task"></div>
                        </div>
                        <div className="column">
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

    _clear(notFull) {
        if (!notFull) {
            this._startTouch = null;
            this._prevTouch  = null;
            this._lastMoveTs = 0;
            this._velocity   = 0;
        }

        cancelAnimationFrame(this._anim);
        document.removeEventListener('touchmove', this._onTouchMove);
        document.removeEventListener('touchend', this._onTouchEnd);

        if (this.state.inSwipe) {
            this.setState({
                inSwipe: false,
            });
        }
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

            this.setState({
                inSwipe: true,
            });
            return;
        }

        e.preventDefault();

        this._velocity = Math.abs((this._prevTouch.x - touch.x) / (Date.now() - this._lastMoveTs));

        this._setShift(-this.state.column * 100 + (touch.x - this._startTouch.x) / this._width);

        this._lastMoveTs = Date.now();
        this._prevTouch = touch;
    }

    _onTouchEnd(e) {
        if (!this._lastMoveTs) {
            return;
        }

        e.preventDefault();

        this._clear(true);

        const startShift = this._shift;

        const n = -this._shift / 100;

        let column;

        if (n < 0) {
            column = 0;
        } else if (n > 4) {
            column = 4;
        } else {
            const min = Math.floor(n);
            const max = Math.ceil(n);

            if (this._velocity > 0.5) {
                if (this._prevTouch.x < this._startTouch.x) {
                    column = max;
                } else {
                    column = min;
                }
            } else {
                if (-this._shift - min * 100 < 50) {
                    column = min;
                } else {
                    column = max;
                }
            }
        }

        const goingTo = -column * 100;

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

        this.setState({
            column,
            inSwipe: false,
        });
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
