import LinearProgress from '@material-ui/core/LinearProgress';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

export default function DetailedProgressBar(props) {
    // {progress && progress.map((elem, index) => (<p key={`${index}-${elem['wstokenid']}`}>{elem.message}</p>))}
    return (
    <Box>
        <Box sx={{ width: '100%' }}>
            <LinearProgressWithLabel value={props.progressPercentage} />
        </Box>
        <Typography paragraph>
            {props.progress && props.progress.map((elem, index) => (<p key={`${index}-${elem['wstokenid']}`}>{elem.message}</p>))}
        </Typography>
    </Box>
    );
}


function LinearProgressWithLabel(props) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant="determinate" {...props} />
        </Box>
        {/* <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
                {`${Math.round(props.value)}%`}
            </Typography>
        </Box> */}
        </Box>
    );
}