import classNames from 'classnames';
import React, {PropTypes} from 'react';

import Button from '../Button';
import Group from '../Group';
import Icon from '../Icon';
import Input from '../Input';
import Picker from './Picker';

import styles from './DatePicker.less';

class DatePicker extends React.Component {
  static propTypes = {
    error: PropTypes.bool,

    /**
     * Минимальный год в селекте для года.
     */
    minYear: PropTypes.number,

    /**
     * Максимальный год в селекте для года.
     */
    maxYear: PropTypes.number,

    value: PropTypes.instanceOf(Date),

    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    onChange: PropTypes.func,
  };

  static defaultProps = {
    minYear: 1900,
    maxYear: 2100,
    width: 120,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      value: checkDate(
        props.value !== undefined ? props.value : null
      ),
      textValue: formatDate(props.value),
      opened: false,
    };

    this._focused = false;
  }

  render() {
    let picker = null;
    if (this.state.opened) {
      picker = (
        <div className={styles.picker} onKeyDown={this.handlePickerKey}>
          <Picker value={this.state.value}
            minYear={this.props.minYear} maxYear={this.props.maxYear}
            onPick={this.handlePick} onClose={this.handlePickerClose}
          />
        </div>
      );
    }
    const className = classNames({
      [styles.root]: true,
      [this.props.className || '']: true,
    });
    return (
      <span className={className} style={{width: this.props.width}}>
        <Group width="100%">
          <Input ref="input" mainInGroup value={this.state.textValue}
            maxLength="10" placeholder="дд.мм.гггг"
            onChange={this.handleChange} onBlur={this.handleBlur}
            onFocus={this.handleFocus} error={this.props.error}
          />
          <Button narrow active={this.state.opened} onClick={this.open}>
            <Icon name="calendar" />
          </Button>
        </Group>
        {picker}
      </span>
    );
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value !== undefined) {
      const date = checkDate(newProps.value);
      this.setState({value: date});

      if (!this._focused) {
        this.setState({textValue: formatDate(date)});
      }
    }
  }

  handleChange = event => {
    const value = event.target.value.replace(/[^\d\.]/g, '');
    this.setState({
      textValue: value,
    });
  };

  handleFocus = () => {
    this._focused = true;

    if (this.props.onFocus) {
      this.props.onFocus();
    }
  };

  handleBlur = () => {
    this._focused = false;

    const date = parseDate(this.state.textValue);
    if (this.props.value === undefined) {
      this.setState({
        value: date,
        textValue: formatDate(date),
      });
    } else {
      this.setState({
        textValue: formatDate(this.props.value),
        value : null,
      });
    }

    if (this.props.onChange && +this.state.value !== +date) {
      this.props.onChange({target: {value: date}}, date);
    }

    if (this.props.onBlur) {
      this.props.onBlur();
    }
  };

  handlePickerKey = event => {
    if (event.key === 'Escape') {
      this.close(true);
    }
  };

  handlePick = date => {
    if (this.props.value === undefined) {
      this.setState({
        value: date,
        textValue: formatDate(date),
      });
    }
    if (this.props.onChange) {
      this.props.onChange({target: {value: date}}, date);
    }
    this.close(false);
  };

  handlePickerClose = () => {
    this.close(false);
  };

  open = () => {
    this.setState({opened: true});
  };

  close(focus) {
    this.setState({opened: false});
    if (focus) {
      setTimeout(() => this.refs.input.focus(), 0);
    }
  }
}

function checkDate(date) {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  return null;
}

function formatDate(date) {
  if (!checkDate(date)) {
    return '';
  }

  const day = formatNumber(date.getDate());
  const month = formatNumber(date.getMonth() + 1);
  return `${day}.${month}.${date.getFullYear()}`;
}

function parseDate(str) {
  str = str || '';
  const match = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (match) {
    let [, date, month, year] = match;
    date = date.padLeft(2, '0');
    month = month.padLeft(2, '0');
    if (year.length === 2) {
      if (parseInt(year, 10) < 50) {
        year = '20' + year;
      } else {
        year = '19' + year;
      }
    }
    return checkDate(new Date(`${year}-${month}-${date}`));
  }
  return null;
}

function formatNumber(value) {
  let ret = value.toString();
  while (ret.length < 2) {
    ret = '0' + ret;
  }
  return ret;
}

export default DatePicker;
