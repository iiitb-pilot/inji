import React from 'react';
import {useTranslation} from 'react-i18next';
import {Theme} from '../../components/ui/styleUtils';
import {Modal} from '../../components/ui/Modal';
import {Pressable} from 'react-native';
import {Column, Row, Text} from '../../components/ui';
import {useScanLayout} from './ScanLayoutController';
import {useSendVcScreen} from './SendVcScreenController';
import testIDProps from '../../shared/commonUtil';
import {SvgImage} from '../../components/ui/svg';
import {Icon} from 'react-native-elements';
import {Dimensions} from 'react-native';

export const SharingSuccessModal: React.FC<
  SharingSuccessModalProps
> = props => {
  const {t} = useTranslation('ScanScreen');
  const scanLayoutController = useScanLayout();
  const sendVcScreenController = useSendVcScreen();

  return (
    <React.Fragment>
      <Modal
        isVisible={props.isVisible}
        showClose={false}
        {...testIDProps(props.testId)}>
        <Column
          margin="64 0"
          crossAlign="center"
          style={Theme.SelectVcOverlayStyles.sharedSuccessfully}>
          {SvgImage.SuccessLogo()}
          <Text margin="20 0" style={Theme.TextStyles.bold} size={'large'}>
            {t('ScanScreen:status.accepted.title')}
          </Text>
          <Text
            align="center"
            style={Theme.TextStyles.regular}
            color={Theme.Colors.statusMessage}>
            {t('ScanScreen:status.accepted.message')}
          </Text>
          <Text style={Theme.TextStyles.bold}>
            {sendVcScreenController.receiverInfo.name}
          </Text>
        </Column>
        <Row
          align="space-evenly"
          style={{marginBottom: Dimensions.get('screen').height * 0.06}}>
          <Pressable>
            <Icon
              name="home"
              color={Theme.Colors.Icon}
              size={33}
              containerStyle={
                Theme.SelectVcOverlayStyles.sharedSuccessfullyIconStyle
              }
              onPress={scanLayoutController.DISMISS}
            />
            <Text align="center" weight="bold">
              {t('ScanScreen:status.accepted.home')}
            </Text>
          </Pressable>
          <Pressable>
            <Icon
              name="history"
              color={Theme.Colors.Icon}
              size={33}
              containerStyle={
                Theme.SelectVcOverlayStyles.sharedSuccessfullyIconStyle
              }
              onPress={scanLayoutController.GOTO_HISTORY}
            />
            <Text align="center" weight="bold">
              {t('ScanScreen:status.accepted.history')}
            </Text>
          </Pressable>
        </Row>
      </Modal>
    </React.Fragment>
  );
};

interface SharingSuccessModalProps {
  isVisible: boolean;
  testId: string;
}
