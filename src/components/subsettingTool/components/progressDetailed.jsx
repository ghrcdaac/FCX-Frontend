import LinearProgress from '@material-ui/core/LinearProgress';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';

export default function DetailedProgressBar(props) {
    // {progress && progress.map((elem, index) => (<p key={`${index}-${elem['wstokenid']}`}>{elem.message}</p>))}
    return (
    <Box>
        <Box sx={{ width: '100%' }}>
            <LinearProgressWithLabel value={props.progressPercentage} />
        </Box>
        <Paper>
            <div style={{margin: "1rem", padding: "1rem"}}>
                {props.progress && props.progress.map((elem, index) => (<Typography variant="h6" key={`${index}-${elem['wstokenid']}`}>{elem.message}</Typography>))}
            </div>
        </Paper>
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