'use strict';
import React from 'react';
import { shallow } from 'enzyme';
import toJSON from "enzyme-to-json"

import './setupTests';

import Timeline from 'timeline';

describe('<Timeline/>', function() {
  it('should have text', function() {
    const wrapper = shallow(
      <Timeline
        items={[]}
        groups={[]}
        startDate={{ date: "2017-05-17"}}
        endDate={{date: "2017-05-17"}}
        onInteraction={() => {}}
      />);
    expect(toJSON(wrapper)).toMatchSnapshot();
  });
});
