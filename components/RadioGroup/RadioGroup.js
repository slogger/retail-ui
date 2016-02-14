import React, {PropTypes} from 'react';

import Radio from '../Radio';

import styles from './RadioGroup.less';

class RadioGroup extends React.Component {
  static propTypes = {
    /**
     * Набор значений. Поддерживаются любые перечисляемые типы, в том числе
     * `Array`, `Map`, `Immutable.Map`.
     *
     * Элементы воспринимаются следующим образом: если элемент — это массив, то
     * первый элемент является значением, а второй — отображается в списке;
     * если элемент не является массивом, то он используется и для отображения,
     * и для значения.
     */
    items: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,

    value: PropTypes.any,

    onChange: PropTypes.func,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      value: props.value !== undefined ? props.value : null,
    };
  }

  render() {
    var inputProps = {
      type: 'checkbox',
      className: styles.input,
      onKeyDown: this.handleKey,
      onFocus: this.handleFocus,
      onBlur: this.handleBlur,
    };
    return (
      <label className={styles.root}>
        <input {...inputProps} />
        {this.renderItems()}
      </label>
    );
  }

  renderItems() {
    var items = [];
    this.eachItem((value, item, i) => {
      if (i) {
        items.push(<br key={'br:' + i} />);
      }

      var checked = this.state.value === value;
      var focused = this.state.focused &&
          (checked || this.state.value == null && i === 0);
      items.push(
        <span key={item} className={styles.item}
          onClick={(e) => this.select_(value)}
        >
          <Radio checked={checked} focused={focused} />
          <span className={styles.label}>{item}</span>
        </span>
      );
    });

    return items;
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value !== undefined) {
      this.setState({value: newProps.value});
    }
  }

  handleKey = event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.move_(-1);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.move_(1);
    }
  };

  handleFocus = event => {
    this.setState({focused: true});
  };

  handleBlur = event => {
    this.setState({focused: false});
  };

  move_(step) {
    const items = [];
    let selectedIndex = -1;
    this.eachItem((value, item, i) => {
      items.push(value);
      if (selectedIndex === -1 && value === this.state.value) {
        selectedIndex = i;
      }
    });

    selectedIndex += step;
    if (selectedIndex < 0) {
      selectedIndex = items.length - 1;
    } else if (selectedIndex >= items.length) {
      selectedIndex = 0;
    }
    this.select_(items[selectedIndex]);
  }

  select_(value) {
    if (this.props.value === undefined) {
      this.setState({value});
    }
    if (this.props.onChange) {
      this.props.onChange({target: {value}}, value);
    }
  }

  eachItem(fn) {
    let index = 0;
    for (const entry of this.props.items) {
      const [value, item] = normalizeEntry(entry);
      fn(value, item, index);
      ++index;
    }
  }
}

function normalizeEntry(entry) {
  if (!Array.isArray(entry)) {
    return [entry, entry];
  }
  return entry;
}

export default RadioGroup;