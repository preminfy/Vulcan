import React from 'react';
import PropTypes from 'prop-types';
import { replaceComponent } from 'meteor/vulcan:core';
import withStyles from '@material-ui/core/styles/withStyles';
import Divider from '@material-ui/core/Divider';
import classNames from 'classnames';


const styles = theme => ({
  divider: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 3,
  },
});


const FormNestedDivider = ({ classes, label, addItem }) => 
  <Divider className={classNames('form-nested-divider', classes.divider)} />;


FormNestedDivider.propTypes = {
  classes: PropTypes.object.isRequired,
  label: PropTypes.string,
  addItem: PropTypes.func,
};


replaceComponent('FormNestedDivider', FormNestedDivider, [withStyles, styles]);
