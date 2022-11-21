import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { red } from '@material-ui/core/colors';

import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import CodeHighlight from "./codeHighlight";
import {code as downloadScript} from '../helper/downloadScript.js';

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: 345,
  },
  media: {
    height: 0,
    paddingTop: '56.25%', // 16:9
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  avatar: {
    backgroundColor: red[500],
  },
}));

export default function RecipeReviewCard(props) {
  const {subsetDir, subsetIndex} = props;
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card className={classes.root} style={{maxWidth: "initial"}}>
      <CardHeader
        title={`Subset ${subsetIndex}`}
        // subheader="Date time"
      />
      <CardContent>
        <Typography variant="body2" color="textSecondary" component="p">
          Expand to see the python script.
          Click on download to save it locally.
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <IconButton aria-label="download">
          <CloudDownloadIcon />
        </IconButton>
        <IconButton
          className={clsx(classes.expand, {
            [classes.expandOpen]: expanded,
          })}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </IconButton>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Typography paragraph>Code:</Typography>
          <Typography paragraph>
            <CodeHighlight className="code_block">
              {downloadScript()}
            </CodeHighlight>
          </Typography>
        </CardContent>
      </Collapse>
    </Card>
  );
}
